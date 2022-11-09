import Discord from 'discord.js'
import Debug from 'debug'

// Setup debug output object
const debug = Debug('bot:member_monitor')

class MemberMonitor {
  constructor (djsGuildMember, guildMonitor) {
    // Store local copies of the guild member object
    this.update(djsGuildMember, guildMonitor)
    debug(`Monitor installed for guild member "${this.guildMember.nickname}" on "${this.guildMonitor.guild.name}"`)
  }

  update (djsGuildMember, guildMonitor) {
    // Update local copies of the guild member object
    this.guildMember = djsGuildMember
    this.guildMonitor = guildMonitor
  }

  // GuildMember events
  guildMemberAvailable (member) {
    debug(`${member.nickname} became available`)
  }

  guildMemberSpeaking (member, speaking) {
    if (speaking.has(Discord.Speaking.FLAGS.SPEAKING | Discord.Speaking.FLAGS.PRIORITY_SPEAKING)) {
      debug(`${member.nickname} is speaking on "${member.guild.name}"`)
    } else {
      debug(`${member.nickname} stopped speaking on "${member.guild.name}"`)
    }
  }

  presenceUpdate (newPres, oldPres) {
    if (oldPres) {
      debug(`${newPres.member.nickname} was ${oldPres.status} and is now ${newPres.status} on ${newPres.guild.name}`)
    } else {
      debug(`${newPres.member.nickname} is now ${newPres.status} on ${newPres.guild.name}`)
    }
  }
}

// Guild member events dispatched to specific monitor instances
MemberMonitor.DISPATCH_EVENTS = [
  'guildMemberAvailable',
  'guildMemberSpeaking'
]

export default MemberMonitor
