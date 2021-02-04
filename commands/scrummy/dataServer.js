// Import the general command object
import DBCommand from '../DBCommand.js'

// Define the clock-in command
class DataServerCommand extends DBCommand {
  constructor () {
    super('!dataserver', ['!ds'], ['start', 'end'], [
      'List all data in a range for this entire server.',
      '"start" and "end" must be parsable by Date.parse().',
      '"end" is optional and defaults to now'
    ])
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    // Check for required start time
    if (args.length < 1 || isNaN(Date.parse(args[0]))) {
      msg.reply('Start time missing or invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
      return
    }

    // Check for optional end time and if it is parsable
    if (args.length >= 2 && isNaN(Date.parse(args[1]))) {
      msg.reply('End time is invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
      return
    }

    // Ensure dates provided use local time zone
    if (args[0].indexOf('T') === -1) { args[0] += 'T00:00:00' }
    if (args.length >= 2 && args[1].indexOf('T') === -1) { args[1] += 'T00:00:00' }

    // Setup date range variables
    const start = new Date(Date.parse(args[0]))
    const end = (args.length >= 2 ? new Date(Date.parse(args[1])) : Date.now())

    try {
      // Get their time card for this server
      const timeCardInRange = await this.getServerDataInRange(start, end, msg.guild.id)
      if (!timeCardInRange || timeCardInRange.length === 0) {
        msg.reply('No data returned.')
        return
      }

      console.error('Debug Data:')
      console.error(timeCardInRange)

      // Build the message
      const message = 'See log'
      // message += '```'

      // Send the full message
      msg.reply(message)
    } catch (err) {
      console.error('Error reporting user data')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const DataServer = new DataServerCommand()
export default DataServer
