import Discord from 'discord.js'
import Debug from 'debug'

// Setup debug output object
const debug = Debug('bot:guild_monitor')

// Guild events that need to be dispatched to a specific guild monitor
class GuildMonitor {
  constructor (djsGuild) {
    // Store local copy of the guild object
    this.update(djsGuild)
    debug(`Monitor installed for server "${this.guild.name}"`)
  }

  update (djsGuild) {
    // Update local copy of the guild object
    this.guild = djsGuild
  }

  // General Events
  guildBanAdd (guild, user) {
    debug(`${user.tag} was added to the BAN list for "${guild.name}"`)
  }

  guildBanRemove (guild, user) {
    debug(`${user.tag} was removed from the BAN list for "${guild.name}"`)
  }

  guildIntegrationsUpdate (guild) {
    debug(`The "${guild.name}" server has updated its integrations.`)
  }

  guildUnavailable (guild) {
    debug(`The "${guild.name}" server has become unavailable.`)
  }
}

GuildMonitor.DISPATCH_EVENTS = [
  'guildBanAdd',
  'guildBanRemove',
  'guildIntegrationsUpdate',
  'guildUnavailable'
]

export default GuildMonitor
