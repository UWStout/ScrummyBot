// Import the general command object
import DBCommand from '../DBCommand.js'

// Helper functions
import { formatDate, formatDuration } from '../util.js'

// Define the clock-in command
class ClockOutCommand extends DBCommand {
  constructor () {
    super('!clockout', ['!co'], 'Clock out and stop tracking your time')
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    try {
      // Record of their last time-clock punch on this server
      let lastPunch = {}

      // Ensure there is a user record
      let dbId = await this.checkIfUserExists(msg.author.id)
      if (!dbId) {
        msg.reply(`Creating new ScrummyBot entry for ${msg.author.tag}`)
        dbId = await this.createUser(msg.author.id, msg.author.tag, msg.guild.id)
      } else {
        // Retrieve the last punch
        lastPunch = await this.getLastPunch(dbId, msg.guild.id)

        // Was it a punch-out?
        if (lastPunch.punch === 'out') {
          msg.reply(`You clocked out of this server on ${formatDate(lastPunch.time)}. Try !clockin first.`)
          return
        }
      }

      // Add a clock-in record
      msg.reply(`Clocking out for ${msg.author.username}.\nYou worked for ${formatDuration(lastPunch.time)}`)
      await this.punchUserTimeCard(dbId, msg.guild.id, 'out')
    } catch (err) {
      console.error('Error clocking out')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const clockOut = new ClockOutCommand()
export default clockOut
