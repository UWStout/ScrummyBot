// Import basic env and debug tools
import Dotenv from 'dotenv'
import Debug from 'debug'

// Import discord.js library objects
import { Client, Events, GatewayIntentBits } from 'discord.js'

// Import our bot command collection
import BotCommands from './commands/index.js'
// import { monitorClient } from './clientMonitor/index.js'

// Setup debug output object
const debug = Debug('bot')

// Running in dev mode?
const _DEV_ = process.argv.some(arg => arg.toLowerCase() === 'dev')

// Initialize environment variables
Dotenv.config()
const TOKEN = (_DEV_ ? process.env.DEV_TOKEN : process.env.TOKEN)

// Initialize the bot
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions
  ]
})

// Setup command processing (see 'commands/index.js')
bot.commands = BotCommands

// Setup general client monitoring (see 'clientMonitor/index.js')
// monitorClient(bot)

// Receive the ready event
bot.once(Events.ClientReady, c => {
  debug(`Ready! Logged in as ${c.user.tag}`)
})

// Handle error events
bot.on(Events.Error, (error) => {
  debug('CLIENT error message:')
  debug(error)
})

// Interaction events
bot.on(Events.InteractionCreate, async (interaction) => {
  // Only care about chat input interactions
  if (!interaction.isChatInputCommand()) {
    return
  }

  // Locate the command
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    debug(`No command matching ${interaction.commandName} was found.`)
  }

  // Try to run the command
  try {
    await command.execute(interaction)
  } catch (error) {
    debug(error)
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    })
  }
})

// Catch and report info on any unhandled promise rejections
process.on('unhandledRejection', error => {
  debug('Unhandled promise rejection:', error)
})

// Login and start up the client
bot.login(TOKEN)
