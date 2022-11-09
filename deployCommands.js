import Dotenv from 'dotenv'
import { REST, Routes } from 'discord.js'

import BotCommands from './commands/index.js'

// Running in dev mode?
const _DEV_ = process.argv.some(arg => arg.toLowerCase() === 'dev')

// Read in secrets
Dotenv.config()
const CLIENT_ID = (_DEV_ ? process.env.DEV_CLIENT_ID : process.env.CLIENT_ID)
const TOKEN = (_DEV_ ? process.env.DEV_TOKEN : process.env.TOKEN)

// Import our bot command collection
const commands = []
BotCommands.forEach(command => {
  commands.push(command.data.toJSON())
})

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(TOKEN)

// Async function to deploy the commands
async function deploy () {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`)

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    )

    console.log(`Successfully reloaded ${data.length} application (/) commands.`)
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error('Failed to deploy')
    console.error(error)
  }
}

// Run the deployment
deploy()
