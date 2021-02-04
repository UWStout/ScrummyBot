// Import the general command object
import DBCommand from '../DBCommand.js'

// Define the clock-in command
class UsersCommand extends DBCommand {
  constructor () {
    super('!users', ['!us'], [], ['List all the users on this server and their', 'current status.'])
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    try {
      // Get their time card for this server
      const allUsers = await this.getUsersOnServer(msg.guild.id)
      if (!allUsers || allUsers.length === 0) {
        msg.reply('No users found (that\'s werid!)')
        return
      }

      // Build the message
      let message = `Scrummy Bot has seen these users on ${msg.guild.name}\n\`\`\``
      allUsers.forEach((user) => {
        message += `- ${user.discordName} is clocked ${user.timeCard.punch}\n`
      })
      message += '```'

      // Send the full message
      msg.reply(message)
    } catch (err) {
      console.error('Error reporting users')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const Users = new UsersCommand()
export default Users
