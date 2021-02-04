// Import the general command object
import DBCommand from '../DBCommand.js'

// Helper functions
import * as UTIL from '../util.js'

// Define the clock-in command
class AdjustCommand extends DBCommand {
  // Build a new DB Command with fixed strings
  constructor () {
    super('!adjust', ['!adj'], ['n', 'new_time'],
      ['Adjust a time-card punch to a new time.', 'Use !list to get valid n value.', '"new_time" must be parsable by Date.parse().']
    )
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    // Check for required index
    if (args.length < 1 || isNaN(args[0])) {
      msg.reply('Punch index is missing or invalid. Run !list first for some valid indexes.')
      return
    }

    // Check for parsable date-time
    if (args.length < 2 || isNaN(Date.parse(args[1]))) {
      msg.reply('New time missing or invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
      return
    }

    // Parse arguments
    const index = parseInt(args[0]) - 1
    const newDate = Date.parse(args[1])

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

      // Find the specific entry to adjust
      if (index < 0 || index >= timeCard.length) {
        msg.reply('Punch index is invalid. Run !list first for some valid indexes.')
        return
      }

      // Adjust entry and update in database
      msg.reply(`Attempting to adjust entry ${index + 1} to time ${UTIL.formatDate(newDate)} ...`)
      const newTimeCard = [...timeCard]
      newTimeCard[index].time = new Date(newDate)
      await this.setUserTimecard(dbId, msg.guild.id, newTimeCard)

      // Send the full message
      msg.reply('Entry updated')
    } catch (err) {
      console.error('Error adjusting entry')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const Adjust = new AdjustCommand()
export default Adjust
