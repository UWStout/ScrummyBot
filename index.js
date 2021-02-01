// Import node module libraries
import Dotenv from 'dotenv'
import Discord from 'discord.js'

// Import our bot command collection
import BotCommands from './commands'

// Initialize environment variables
Dotenv.config()
const TOKEN = process.env.TOKEN

// Initialize the bot
const bot = new Discord.Client()
bot.login(TOKEN)

// Setup command processing
bot.commands = BotCommands

// Respond to ready event
bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`)
})

// Respond to message event
bot.on('message', (msg) => {
  // Split message to search for a bot command
  const args = msg.content.split(/\s+/)
  const command = args.shift().toLowerCase()

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
