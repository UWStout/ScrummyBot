// Bring in discord.js library
import Discord from 'discord.js'

// Bring in all our commands
import ping from './scrummy/ping.js'
import clockIn from './scrummy/clockIn.js'
import clockOut from './scrummy/clockOut.js'
import status from './scrummy/status.js'

// Build command array
const commands = [ping, clockIn, clockOut, status]

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
