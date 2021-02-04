import fs from 'fs'

// Import the general command object
import DBCommand from '../DBCommand.js'

import ChartBuilder from '../../chartBuilder.js'

import { MessageAttachment, MessageEmbed } from 'discord.js'

// Define the clock-in command
class DataUserCommand extends DBCommand {
  constructor () {
    super('!datauser', ['!du'], ['start', 'end'], [
      'List all data in a range for your account.',
      '"start" and "end" must be parsable by Date.parse().',
      '"end" is optional and defaults to now'
    ])

    this.chartBuilder = new ChartBuilder()
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    // Check for required start time
    if (args.length < 1 || isNaN(Date.parse(args[0]))) {
      msg.reply('Start time missing or invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
      return
    }

    // Check for optional end time and if it is parsable
    if (args.length >= 2 && isNaN(Date.parse(args[1]))) {
      msg.reply('End time is invalid.\n```Example: 2021-04-02T13:25:30\n         YYYY-MM-DDTHH:MM:SS```\n(note letter T and 24-hour format)')
      return
    }

    // Ensure dates provided use local time zone
    if (args[0].indexOf('T') === -1) { args[0] += 'T00:00:00' }
    if (args.length >= 2 && args[1].indexOf('T') === -1) { args[1] += 'T00:00:00' }

    // Setup date range variables
    const start = new Date(Date.parse(args[0]))
    const end = (args.length >= 2 ? new Date(Date.parse(args[1])) : Date.now())

    try {
      // Ensure there is a user record
      const dbId = await this.checkIfUserExists(msg.author.id)
      if (!dbId) {
        msg.reply('You haven\'t used ScrummyBot to track time yet. Try !clockin first.')
        return
      }

      // Get their time card for this server
      const timeCardInRange = await this.getServerDataInRange(start, end, dbId, msg.guild.id)
      if (!timeCardInRange || timeCardInRange.length === 0) {
        msg.reply('No data returned.')
        return
      }

      // Make the chart and send it
      const imageBuffer = await this.chartBuilder.makeUserHoursChart(timeCardInRange[0].discordName, start, end, timeCardInRange)
      msg.channel.send(`${msg.author} Here is your data`, { files: [imageBuffer] })
    } catch (err) {
      console.error('Error reporting user data')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const DataUser = new DataUserCommand()
export default DataUser
