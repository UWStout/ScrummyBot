// Import the general command object
import Command from '../Command.js'

// Define the ping command
class PingCommand extends Command {
  constructor () {
    super('!ping', 'Ping the bot, responds with pong')
  }

  // Override execute method
  execute (msg, args) {
    msg.reply('pong')
  }
}

// Instantiate and export as a singleton for import into other files
const ping = new PingCommand()
export default ping
