// Import the general command object
import DBCommand from '../DBCommand.js'

// Helper functions
import * as UTIL from '../util.js'

// Define the clock-in command
class StatusCommand extends DBCommand {
  constructor () {
    super('!status', ['!stat', '!st'], 'Report time tacking status for this server.')
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

      // Find all punches from this week (since most recent monday boundary)
      let mondayIndex = timeCard.length - 1
      while (mondayIndex >= 0 && UTIL.mondaysBetween(timeCard[mondayIndex].time) === 0) {
        mondayIndex--
      }
      const timeCardWeek = timeCard.slice(mondayIndex + 1)

      // Report info about their most recent punch
      let message = ''
      const lastPunch = timeCard[timeCard.length - 1]
      if (lastPunch.punch === 'out') {
        message += `You are currently clocked out. You clocked out on ${UTIL.formatDate(lastPunch.time)}.`
      } else {
        message += `You are currently clocked in and have been working for ${UTIL.formatDuration(lastPunch.time)}.`
      }

      // Report hours worked so far this week (since monday)
      if (timeCardWeek.length === 0) {
        message += '\nYou have not clocked any hours since Monday.'
      } else {
        const minutesWeek = UTIL.sumPunches(timeCardWeek)
        message += `\nSince Monday, you have worked for ${UTIL.formatDuration(minutesWeek)}`
      }

      // Send the status reply
      msg.reply(message)
    } catch (err) {
      console.error('Error reporting status')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const Status = new StatusCommand()
export default Status
