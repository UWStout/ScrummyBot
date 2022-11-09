import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as UTIL from '../util.js'
import * as DB from '../dbHelper.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:list')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('list')
slashCommandData.setDescription('List your "n" most recent punches on this server (defaults to 4)')
slashCommandData.addIntegerOption(option =>
  option.setName('n')
    .setDescription('Number of punches to list')
    .setMinValue(1)
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
    let timeCard = await DB.getUserTimeCard(dbId, interaction.guild.id)
    if (!timeCard || timeCard.length === 0) {
      await interaction.followUp('You haven\'t clocked in on this server yet. Try /clockin first.')
      return
    }

    // Trim to only the entries of interest
    const count = interaction.options.getInteger('n') ?? 4
    const fullLength = timeCard.length
    const offset = Math.max(0, timeCard.length - count)
    if (fullLength > count) { timeCard = timeCard.slice(offset) }

    if (timeCard.length === 0) {
      await interaction.followUp('The list is empty, try again with a higher number.')
    } else {
      // Start with the number of entries
      const verb = timeCard.length === 1 ? 'is' : 'are'
      const plural = timeCard.length === 1 ? 'punch' : 'punches'
      let message = `Here ${verb} your last ${timeCard.length} ${plural}`

      // Add each punch to the list
      timeCard.forEach((curPunch, i) => {
        message += `\n${i + offset + 1}) Clock ${curPunch.punch}: ${UTIL.formatDate(curPunch.time)}`
      })

      // Send the full message
      await interaction.followUp(message)
    }
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
