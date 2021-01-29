// Import the general command object
import DBCommand from '../DBCommand.js'

// Helper functions
import { formatDate } from '../util.js'

// Define the clock-in command
class ClockInCommand extends DBCommand {
  constructor () {
    super('!clockin', ['!ci'], 'Clock in and begin tracking your time')
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
      let dbId = await this.checkIfUserExists(msg.author.id)
      if (!dbId) {
        msg.reply(`Creating new ScrummyBot entry for ${msg.author.tag}`)
        dbId = await this.createUser(msg.author.id, msg.author.tag)
      } else {
        // Are they already clocked in
        const lastPunch = await this.getLastPunch(dbId, msg.guild.id)
        if (lastPunch.punch === 'in') {
          msg.reply(`You already clocked in to this server on ${formatDate(lastPunch.time)}. Try !clockout first.`)
          return
        }
      }

      // Add a clock-in record
      msg.reply(`Clocking in for ${msg.author.username}`)
      await this.punchUserTimeCard(dbId, msg.guild.id, 'in')
    } catch (err) {
      console.error('Error clocking in')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const clockIn = new ClockInCommand()
export default clockIn
