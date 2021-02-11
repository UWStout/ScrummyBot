// Import node module libraries
import Dotenv from 'dotenv'
import Discord from 'discord.js'

// Import our bot command collection
import BotCommands from './commands'
import { monitorClient } from './clientMonitor'

// Initialize environment variables
Dotenv.config()
const TOKEN = (_DEV_ ? process.env.DEV_TOKEN : process.env.TOKEN)

// Initialize the bot
const bot = new Discord.Client({
  ws: {
    intents: [
      'GUILDS',
      'GUILD_MEMBERS',
      'GUILD_BANS',
      'GUILD_EMOJIS',
      'GUILD_VOICE_STATES',
      'GUILD_PRESENCES',
      'GUILD_MESSAGES',
      'GUILD_MESSAGE_REACTIONS',
      'DIRECT_MESSAGES',
      'DIRECT_MESSAGE_REACTIONS'
    ]
  }
})

// Setup command processing (see 'commands/index.js')
bot.commands = BotCommands

// Setup general client monitoring (see 'clientMonitor/index.js')
monitorClient(bot)

// Receive the ready event
bot.on('ready', () => {
  console.info('Client Ready')
})

// Handle error events
bot.on('error', (error) => {
  console.error('CLIENT error message:')
  console.error(error)
})

// Respond to message event
bot.on('message', (msg) => {
  // Split message to search for a bot command
  const args = msg.content.split(/\s+/)
  const command = args.shift().toLowerCase()

  console.info('Message: ', msg)

  // This is not a command
  if (!bot.commands.has(command)) return

  // Dispatch the command
  console.info(`Called command: ${command}`)
  try {
    bot.commands.get(command).execute(msg, args)
  } catch (error) {
    console.error(error)
    msg.reply('there was an error trying to execute that command!')
  }
})

// Catch and report info on any unhandled promise rejections
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error)
})

// Login and start up the client
bot.login(TOKEN)
