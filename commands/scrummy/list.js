// Import the general command object
import DBCommand from '../DBCommand.js'

// Helper functions
import * as UTIL from '../util.js'

// Define the clock-in command
class ListCommand extends DBCommand {
  constructor () {
    super('!list', ['!ls'], ['n'], ['List your "n" most recent punches on this', 'server (defaults to 4).'])
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    try {
      // Ensure there is a user record
      const dbId = await this.checkIfUserExists(msg.author.id)
      if (!dbId) {
        msg.reply('You haven\'t used ScrummyBot to track time yet. Try !clockin first.')
        return
      }

      // Get their time card for this server
      let timeCard = await this.getUserTimeCard(dbId, msg.guild.id)
      if (!timeCard || timeCard.length === 0) {
        msg.reply('You haven\'t clocked in on this server yet. Try !clockin first.')
        return
      }

      // Trim to only the entries of interest
      const count = (args[0] && !isNaN(parseInt(args[0])) ? args[0] : 4)
      if (timeCard.length > count) {
        timeCard = timeCard.slice(timeCard.length - count)
      }

      if (timeCard.length === 0) {
        msg.reply('The list is empty, try again with a higher number.')
      } else {
        // Start with the number of entries
        const verb = timeCard.length === 1 ? 'is' : 'are'
        const plural = timeCard.length === 1 ? 'punch' : 'punches'
        let message = `Here ${verb} your last ${timeCard.length} ${plural}`

        // Add each punch to the list
        timeCard.forEach((curPunch, i) => {
          message += `\n${i + 1}) Clock ${curPunch.punch}: ${UTIL.formatDate(curPunch.time)}`
        })

        // Send the full message
        msg.reply(message)
      }
    } catch (err) {
      console.error('Error reporting list')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const List = new ListCommand()
export default List
