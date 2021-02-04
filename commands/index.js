// Bring in discord.js library
import Discord from 'discord.js'

// The base command object
import Command from './Command.js'

// Bring in all our commands
import ping from './scrummy/ping.js'
import clockIn from './scrummy/clockIn.js'
import clockOut from './scrummy/clockOut.js'
import status from './scrummy/status.js'
import list from './scrummy/list.js'
import summary from './scrummy/summary.js'
import adjust from './scrummy/adjust.js'
import users from './scrummy/users.js'

// Build command array
const commands = [ping, clockIn, clockOut, status, list, summary, adjust, users]

function makeHelpString (command) {
  let cmdList = command.name
  if (command.alias.length > 0) { cmdList += ', ' + command.alias.join(', ') }

  let params = '[n/a]'
  if (command.params.length > 0) { params = command.params.join(', ') }

  let description = ''
  let first = true
  command.description.forEach((descLine) => {
    if (first) {
      description += descLine
    } else {
      description += '\n' + ' '.repeat(35) + descLine
    }
    first = false
  })

  return cmdList.padEnd(20, ' ') + ' ' + params.padEnd(13, ' ') + ' ' + description + '\n'
}

// Build the help description string
let helpDescription = 'Scrummy bot supports these commands:\n```'
helpDescription += 'Command              Params        Description\n'
helpDescription += '==============================================================================\n'
commands.forEach((curCmd) => {
  helpDescription += makeHelpString(curCmd)
})

// Build the help command
class Help extends Command {
  constructor () {
    super('!help', ['!?'], [], 'Show this list of commands')
    this.output = helpDescription
    this.output += makeHelpString(this)
    this.output += '```'
  }

  execute (msg, args) { msg.reply(this.output) }
}

// Instantiate and add the help command
const help = new Help()
commands.push(help)

// Build command collection
const BotCommands = new Discord.Collection()
commands.forEach((cmd) => {
  BotCommands.set(cmd.name, cmd)
  cmd.alias.forEach((aliasName) => {
    BotCommands.set(aliasName, cmd)
  })
})

// Export command collection
export default BotCommands
