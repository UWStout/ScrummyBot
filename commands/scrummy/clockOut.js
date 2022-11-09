import { SlashCommandBuilder } from 'discord.js'

// Helper functions
import * as DB from '../dbHelper.js'
import { formatDate, formatDuration } from '../util.js'

// Debugging output
import Debug from 'debug'
const debug = Debug('bot:cmd:clock_out')

// The core data for this command
const slashCommandData = new SlashCommandBuilder()
slashCommandData.setName('clockout')
slashCommandData.setDescription('Clock out and stop tracking your time')

// the main callback function for this command
const slashCommandExecute = async (interaction) => {
  // Only makes sense inside a server channel
  if (!interaction.guild) {
    await interaction.reply('This command only works in a specific server channel')
    return
  }

  try {
    // Record of their last time-clock punch on this server
    let lastPunch = {}

    // Ensure there is a user record
    let dbId = await DB.checkIfUserExists(interaction.user.id)
    if (!dbId) {
      await interaction.reply(`Creating new ScrummyBot entry for ${interaction.user.tag}`)
      dbId = await DB.createUser(interaction.user.id, interaction.user.tag, interaction.guild.id)
    } else {
      // Retrieve the last punch
      lastPunch = await DB.getLastPunch(dbId, interaction.guild.id)

      // Was it a punch-out?
      if (lastPunch.punch === 'out') {
        await interaction.reply(`You clocked out of this server on ${formatDate(lastPunch.time)}. Try /clockin first.`)
        return
      }
    }

    // Add a clock-in record
    await interaction.reply(`Clocking out for ${interaction.user.username}.\nYou worked for ${formatDuration(lastPunch.time)}`)
    await DB.punchUserTimeCard(dbId, interaction.guild.id, 'out')
  } catch (err) {
    debug('Error clocking out')
    debug(err)
  }
}

// Export command
export default {
  data: slashCommandData,
  execute: slashCommandExecute
}
