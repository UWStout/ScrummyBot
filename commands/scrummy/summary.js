import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as UTIL from '../util.js'
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:summary')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('summary')
slashCommandData.setDescription('List times worked (and length) back to indicated day of the week.')
slashCommandData.addStringOption(option =>
  option.setName('day')
    .setDescription('Day to start the week (defaults to Sunday)')
    .addChoices(
      { name: 'Sunday', value: 'sunday' },
      { name: 'Monday', value: 'monday' },
      { name: 'Tuesday', value: 'tuesday' },
      { name: 'Wednesday', value: 'wednesday' },
      { name: 'Thursday', value: 'thursday' },
      { name: 'Friday', value: 'friday' },
      { name: 'Saturday', value: 'saturday' }
    )
)

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

    // Find all punches up to the requested day
    const day = interaction.options.getString('day') ?? 'sunday'
    let dayIndex = timeCard.length - 1
    while (dayIndex >= 0 && UTIL.daysBetween(day, timeCard[dayIndex].time) === 0) {
      dayIndex--
    }
    const timeCardWeek = timeCard.slice(dayIndex + 1)

    if (timeCardWeek.length === 0) {
      await interaction.followUp('No tracked work found in that range.')
    } else {
      // Build the message
      let message = `Here is you summary of work since ${day}:\n`
      for (let i = 0; i < timeCardWeek.length - 1; i += 2) {
        const start = timeCardWeek[i].time
        const end = timeCardWeek[i + 1].time
        message += `- from ${UTIL.formatDate(start)} to ${UTIL.formatDate(end)} you worked for ${UTIL.formatDuration(start, end)}\n`
      }
      if (timeCardWeek.length % 2 === 1) {
        const clockIn = timeCardWeek[timeCardWeek.length - 1].time
        message += `- you clocked in on ${UTIL.formatDate(clockIn)} and have been working for ${UTIL.formatDuration(clockIn)}\n`
      }

      const minutesWeek = UTIL.sumPunches(timeCardWeek)
      message += `TOTAL since ${day}: ${UTIL.formatDuration(minutesWeek)}`

      // Send the full message
      await interaction.followUp(message)
    }
  } catch (err) {
    debug('Error reporting summary')
    debug(err)
    await interaction.followUp('Uh-oh, something went wrong.')
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
