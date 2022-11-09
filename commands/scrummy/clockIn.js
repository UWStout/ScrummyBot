import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as DB from '../dbHelper.js'
import { formatDate } from '../util.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:clock_in')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('clockin')
slashCommandData.setDescription('Clock in and begin tracking your time')

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
    let dbId = await DB.checkIfUserExists(interaction.user.id)
    if (!dbId) {
      await interaction.followUp(`Creating new ScrummyBot entry for ${interaction.user.tag}`)
      dbId = await DB.createUser(interaction.user.id, interaction.user.tag)
    } else {
      // Are they already clocked in
      const lastPunch = await DB.getLastPunch(dbId, interaction.guild.id)
      if (lastPunch.punch === 'in') {
        await interaction.followUp(`You already clocked in to this server on ${formatDate(lastPunch.time)}. Try /clockout first.`)
        return
      }
    }

    // Add a clock-in record
    await interaction.followUp(`Clocking in for ${interaction.user.username}`)
    await DB.punchUserTimeCard(dbId, interaction.guild.id, 'in')
  } catch (err) {
    debug('Error clocking in')
    debug(err)
    await interaction.followUp('Uh-oh, something went wrong.')
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
