import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

// Helper functions
import ChartBuilder from '../../chartBuilder.js'
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:dataServer')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('dataserver')
slashCommandData.setDescription('List all data in a range for this entire server.')
slashCommandData.addStringOption(option =>
  option.setName('start')
    .setDescription('A date for the start of the range. Must be parsable by Date.parse().')
    .setRequired(true)
)
slashCommandData.addStringOption(option =>
  option.setName('end')
    .setDescription('A date for the end of the range (defaults to now). Must be parsable by Date.parse().')
)

const chartBuilder = new ChartBuilder()

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  // Only makes sense inside a server channel
  if (!interaction.guild) {
    await interaction.reply('This command only works in a specific server channel')
    return
  }

  // Setup date range variables
  let startStr = interaction.options.getString('start')
  let endStr = interaction.options.getString('end')

  // Ensure dates provided use local time zone
  if (startStr.indexOf('T') === -1) { startStr += 'T00:00:00' }
  if (endStr && endStr.indexOf('T') === -1) { endStr += 'T00:00:00' }

  // Parse to date types
  const start = Date.parse(startStr)
  const end = (endStr ? Date.parse(endStr) : Date.now())

  // Check for valid dates
  if (isNaN(start)) {
    await interaction.reply('Start time missing or invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
    return
  }

  if (isNaN(end)) {
    await interaction.reply('End time is invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
    return
  }

  // Acknowledge receipt of interaction
  await interaction.deferReply()

  // Prepare response
  try {
    // Get their time card for this server
    const timeCardInRange = await DB.getServerDataInRange(new Date(start), new Date(end), interaction.guild.id)
    if (!timeCardInRange || timeCardInRange.length === 0) {
      await interaction.followUp('No data returned.')
      return
    }

    // Make the chart and send it
    const imageBuffer = chartBuilder.makeServerHoursChart(interaction.guild.name, new Date(start), new Date(end), timeCardInRange)
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'serverData.png' })
    const embed = new EmbedBuilder()
      .setTitle(`Chart of Time Worked for all ${interaction.guild.name} users`)
      .setImage('attachment://serverData.png')
    await interaction.followUp(
      { embeds: [embed], files: [attachment] }
    )
  } catch (err) {
    debug('Error reporting list')
    debug(err)
    await interaction.followUp('Uh-oh, something went wrong.')
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
