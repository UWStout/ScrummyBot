import { SlashCommandBuilder } from 'discord.js'

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('ping')
slashCommandData.setDescription('Replies with Pong!')

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  await interaction.reply('Pong!')
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
