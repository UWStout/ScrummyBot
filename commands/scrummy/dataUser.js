import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'

// Helper functions
import ChartBuilder from '../../chartBuilder.js'
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:dataUser')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('datauser')
slashCommandData.setDescription('List all data in a range for your account.')
slashCommandData.addStringOption(option =>
  option.setName('start')
    .setDescription('A date for the start of the range. Must be parsable by Date.parse().')
    .setRequired(true)
)
slashCommandData.addStringOption(option =>
  option.setName('end')
    .setDescription('A date for the end of the range (defaults to now). Must be parsable by Date.parse().')
)

// Tool for building our charts
const chartBuilder = new ChartBuilder()

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  await interaction.reply('Generating data charts is currently broken so it has been disabled.')

  // // Only makes sense inside a server channel
  // debug(1)
  // if (!interaction.guild) {
  //   await interaction.reply('This command only works in a specific server channel')
  //   return
  // }
  // debug(2)

  // // Setup date range variables
  // let startStr = interaction.options.getString('start')
  // let endStr = interaction.options.getString('end')

  // debug(3)
  // // Ensure dates provided use local time zone
  // if (startStr.indexOf('T') === -1) { startStr += 'T00:00:00' }
  // if (endStr && endStr.indexOf('T') === -1) { endStr += 'T00:00:00' }

  // debug(4)
  // // Parse to date types
  // const start = Date.parse(startStr)
  // const end = (endStr ? Date.parse(endStr) : Date.now())

  // debug(5)
  // // Check for valid dates
  // if (isNaN(start)) {
  //   await interaction.reply('Start time missing or invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
  //   return
  // }

  // if (isNaN(end)) {
  //   await interaction.reply('End time is invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
  //   return
  // }

  // debug(6)
  // // Acknowledge receipt of interaction
  // await interaction.deferReply()

  // debug('Range is')
  // debug(new Date(start))
  // debug(new Date(end))
  // // Prepare response
  // try {
  //   debug(7)
  //   // Ensure there is a user record
  //   const dbId = await DB.checkIfUserExists(interaction.user.id)
  //   if (!dbId) {
  //     await interaction.followUp('You haven\'t used ScrummyBot to track time yet. Try /clockin first.')
  //     return
  //   }

  //   debug(8)
  //   // Get their time card for this server
  //   const timeCardInRange = await DB.getServerDataInRange(new Date(start), new Date(end), dbId, interaction.guild.id)
  //   if (!timeCardInRange || timeCardInRange.length === 0) {
  //     await interaction.followUp('No data returned.')
  //     return
  //   }

  //   debug(9)
  //   // Make the chart and send it
  //   const imageBuffer = await chartBuilder.makeUserHoursChart(timeCardInRange[0].discordName, new Date(start), new Date(end), timeCardInRange)
  //   const attachment = new AttachmentBuilder(imageBuffer, { name: 'userData.png' })
  //   await interaction.followUp(`${interaction.user} Here is your data`, { attachments: [attachment] })
  //   debug(10)
  // } catch (err) {
  //   debug(11)
  //   debug('Error reporting user data')
  //   debug(err)
  //   await interaction.followUp('Uh-oh, something went wrong.')
  //   debug(12)
  // }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
