import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:users')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('users')
slashCommandData.setDescription('List all the users on this server and their current status.')

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  // Only makes sense inside a server channel
  if (!interaction.guild) {
    await interaction.reply('This command only works in a specific server channel')
    return
  }

  // Acknowledge receipt of interaction
  await interaction.deferReply()

  // Prepare response
  try {
    // Get their time card for this server
    const allUsers = await DB.getUsersOnServer(interaction.guild.id)
    if (!allUsers || allUsers.length === 0) {
      await interaction.followUp('No users found (that\'s weird!)')
      return
    }

    // Build the message
    let message = `Scrummy Bot has seen these users on ${interaction.guild.name}\n\`\`\``
    allUsers.forEach((user) => {
      message += `- ${user.discordName} is clocked ${user.timeCard.punch}\n`
    })
    message += '```'

    // Send the full message
    await interaction.followUp(message)
  } catch (err) {
    debug('Error reporting users')
    debug(err)
    await interaction.followUp('Uh-oh, something went wrong.')
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
