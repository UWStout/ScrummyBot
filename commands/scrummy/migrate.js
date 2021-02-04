// Import the general command object
import DBCommand from '../DBCommand.js'

// Define the clock-in command
class MigrateCommand extends DBCommand {
  constructor () {
    super('!migrate', ['!mig'], 'Migrate database from v1 to v2.')
  }

  // Override execute method
  async execute (msg, args) {
    // Only makes sense inside a server channel
    if (!msg.guild) {
      msg.reply('This command only works in a specific server channel')
      return
    }

    try {
      // Get all the v1 timecard users in the database
      const allUsers = await this.getOldUsers()
      if (!allUsers || allUsers.length === 0) {
        msg.reply('No old users found.')
        return
      }

      // Start message
      const plural = (allUsers.length === 1 ? 'user' : 'users')
      msg.reply(`Migrating ${allUsers.length} ${plural}`)

      // Await migration of each user
      for (let i = 0; i < allUsers.length; i++) {
        await this.upgradeUserTimeCard(allUsers[i]._id)
      }

      // Done message
      msg.reply('Migration complete.')
    } catch (err) {
      msg.reply('Whoops, something went wrong.')
      console.error('Error migrating users')
      console.error(err)
    }
  }
}

// Instantiate and export as a singleton for import into other files
const Migrate = new MigrateCommand()
export default Migrate
