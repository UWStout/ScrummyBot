import { SlashCommandBuilder } from 'discord.js'

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('user')
slashCommandData.setDescription('Provides information about the user.')

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  await interaction.reply(
    `This command was run by ${interaction.user.username}, ` +
    `who joined on ${interaction.member.joinedAt}.`
  )
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
