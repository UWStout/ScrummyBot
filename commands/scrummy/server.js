import { SlashCommandBuilder } from 'discord.js'

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('server')
slashCommandData.setDescription('Provides information about the server.')

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  await interaction.reply(
    `This server is ${interaction.guild.name} ` +
    `and has ${interaction.guild.memberCount} members.`
  )
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
