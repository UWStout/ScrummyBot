// Import the general command object
import DBCommand from '../DBCommand.js'

// Helper functions
import * as UTIL from '../util.js'

// Define the clock-in command
class SummaryCommand extends DBCommand {
  constructor () {
    super('!summary', ['!sum'], 'Param: day-of-week, list all times work (and length) back to indicated day (default: sunday).')
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    try {
      // Ensure there is a user record
      const dbId = await this.checkIfUserExists(msg.author.id)
      if (!dbId) {
        msg.reply('You haven\'t used ScrummyBot to track time yet. Try !clockin first.')
        return
      }

      // Get their time card for this server
      const timeCard = await this.getUserTimeCard(dbId, msg.guild.id)
      if (!timeCard || timeCard.length === 0) {
        msg.reply('You haven\'t clocked in on this server yet. Try !clockin first.')
        return
      }

      // Find all punches up to the requested day
      const day = (args[0] ? args[0] : 'sunday')
      let dayIndex = timeCard.length - 1
      while (dayIndex >= 0 && UTIL.daysBetween(day, timeCard[dayIndex].time) === 0) {
        dayIndex--
      }
      const timeCardWeek = timeCard.slice(dayIndex + 1)

      if (timeCardWeek.length === 0) {
        msg.reply('No tracked work found in that range.')
      } else {
        // Build the message
        let message = `Here is you summary of work since ${day}:\n`
        for (let i = 0; i < timeCardWeek.length - 1; i += 2) {
          const start = timeCardWeek[i].time
          const end = timeCardWeek[i + 1].time
          message += `- from ${UTIL.formatDate(start)} to ${UTIL.formatDate(end)} you worked for ${UTIL.formatDuration(start, end)}\n`
        }
        if (timeCardWeek.length % 2 === 1) {
          const clockIn = timeCardWeek[timeCardWeek.length - 1].time
          message += `- you clocked in on ${UTIL.formatDate(clockIn)} and have been working for ${UTIL.formatDuration(clockIn)}\n`
        }

        const minutesWeek = UTIL.sumPunches(timeCardWeek)
        message += `TOTAL since ${day}: ${UTIL.formatDuration(minutesWeek)}`

        // Send the full message
        msg.reply(message)
      }
    } catch (err) {
      console.error('Error reporting summary')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const Summary = new SummaryCommand()
export default Summary
