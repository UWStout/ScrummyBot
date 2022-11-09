import Debug from 'debug'

// Bring in discord.js library
import { Collection } from 'discord.js'

// Bring in all our commands
import ping from './scrummy/ping.js'
import clockIn from './scrummy/clockIn.js'
import clockOut from './scrummy/clockOut.js'
import status from './scrummy/status.js'
import list from './scrummy/list.js'
import summary from './scrummy/summary.js'
import users from './scrummy/users.js'
import adjust from './scrummy/adjust.js'
import dataUser from './scrummy/dataUser.js'
import dataServer from './scrummy/dataServer.js'

// Build command array
const commands = [ping, clockIn, clockOut, status, list, summary, users, adjust, dataUser, dataServer]

// Setup debug output object
const debug = Debug('bot:commands')

// Build command collection
const BotCommands = new Collection()
commands.forEach(command => {
  if ('data' in command && 'execute' in command) {
    BotCommands.set(command.data.name, command)
  } else {
    debug('[WARNING] Command is missing a required "data" or "execute" property.')
  }
})

// Export command collection
export default BotCommands
