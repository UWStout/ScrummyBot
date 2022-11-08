import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as UTIL from '../util.js'
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:adjust')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('adjust')
slashCommandData.setDescription('Adjust a time-card punch to a new time.')
slashCommandData.addIntegerOption(option =>
  option.setName('n')
    .setDescription('The index of the punch to adjust as shown by the /list command')
    .setMinValue(1)
    .setRequired(true)
)
slashCommandData.addStringOption(option =>
  option.setName('newtime')
    .setDescription('A date-time to use for the indicated punch. Must be parsable by Date.parse().')
    .setRequired(true)
)

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  // Only makes sense inside a server channel
  if (!interaction.guild) {
    await interaction.reply('This command only works in a specific server channel')
    return
  }

  // Parse arguments
  const index = interaction.options.getInteger('n') - 1
  let newDateStr = interaction.options.getString('newtime')
  if (newDateStr.indexOf('T') === -1) { newDateStr += 'T00:00:00' }
  const newDate = Date.parse(newDateStr)

  // Check for parsable date-time
  if (isNaN(newDate)) {
    await interaction.reply('New time missing or invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
    return
  }

  // Acknowledge receipt of interaction
  await interaction.deferReply()

  // Prepare response
  try {
    // Ensure there is a user record
    const dbId = await DB.checkIfUserExists(interaction.user.id)
    if (!dbId) {
      await interaction.followUp('You haven\'t used ScrummyBot to track time yet. Try /clockin first.')
      return
    }

    // Get their time card for this server
    const timeCard = await DB.getUserTimeCard(dbId, interaction.guild.id)
    if (!timeCard || timeCard.length === 0) {
      await interaction.followUp('You haven\'t clocked in on this server yet. Try /clockin first.')
      return
    }

    // Find the specific entry to adjust
    if (index < 0 || index >= timeCard.length) {
      await interaction.followUp('Punch index is invalid. Run /list first for some valid indexes.')
      return
    }

    // Adjust entry and update in database
    await interaction.followUp(`Attempting to adjust entry ${index + 1} to time ${UTIL.formatDate(newDate)} ...`)
    const newTimeCard = [...timeCard]
    newTimeCard[index].time = new Date(newDate)
    await DB.setUserTimecard(dbId, interaction.guild.id, newTimeCard)

    // Send the full message
    await interaction.followUp('Entry updated')
  } catch (err) {
    debug('Error adjusting entry')
    debug(err)
    await interaction.followUp('Uh-oh, something went wrong.')
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
