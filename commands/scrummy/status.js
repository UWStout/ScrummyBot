import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as UTIL from '../util.js'
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:status')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('status')
slashCommandData.setDescription('Report time tacking status for this server.')

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

    // Find all punches from this week (since most recent monday boundary)
    let mondayIndex = timeCard.length - 1
    while (mondayIndex >= 0 && UTIL.mondaysBetween(timeCard[mondayIndex].time) === 0) {
      mondayIndex--
    }
    const timeCardWeek = timeCard.slice(mondayIndex + 1)

    // Report info about their most recent punch
    let message = ''
    const lastPunch = timeCard[timeCard.length - 1]
    if (lastPunch.punch === 'out') {
      message += `You are currently clocked out. You clocked out on ${UTIL.formatDate(lastPunch.time)}.`
    } else {
      message += `You are currently clocked in and have been working for ${UTIL.formatDuration(lastPunch.time)}.`
    }

    // Report hours worked so far this week (since monday)
    if (timeCardWeek.length === 0) {
      message += '\nYou have not clocked any hours since Monday.'
    } else {
      const minutesWeek = UTIL.sumPunches(timeCardWeek)
      message += `\nSince Monday, you have worked for ${UTIL.formatDuration(minutesWeek)}`
    }

    // Send the status reply
    await interaction.followUp(message)
  } catch (err) {
    debug('Error reporting status')
    debug(err)
    await interaction.followUp('Uh-oh, something went wrong.')
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
