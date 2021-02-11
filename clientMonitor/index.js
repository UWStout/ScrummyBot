import Debug from 'debug'

import GuildMonitor from './GuildMonitor.js'
import MemberMonitor from './MemberMonitor.js'

// Setup debug output object
const debug = Debug('bot:client_monitor')

// The client we are monitoring
let CURRENT_CLIENT = null

// Active monitors
const GUILD_MONITORS = {}
const MEMBER_MONITORS = {}

// Setup callback for each event
export function monitorClient (client) {
  // Save reference to client
  CURRENT_CLIENT = client

  // Setup guild event monitoring
  debug('Installing server monitoring callbacks')
  setupGuildMonitor(client)

  // Setup guildMember event monitoring
  debug('Installing member monitoring callbacks')
  setupMemberMonitor(client)
}

function setupGuildMonitor (client) {
  // Joining and leaving events
  client.on('guildCreate', (guild) => {
    debug(`Joined server "${guild.name}" (${guild.id})!`)
    if (GUILD_MONITORS[guild.id]) {
      debug(`WARNING: Server monitor already exists for "${guild.name}", updating`)
      GUILD_MONITORS[guild.id].update(guild)
    } else {
      GUILD_MONITORS[guild.id] = new GuildMonitor(guild)
    }
  })

  client.on('guildDelete', (guild) => {
    debug(`Left/kicked from server "${guild.name}" (${guild.id})!`)
    GUILD_MONITORS[guild.id] = undefined
  })

  // Handle guild Updates
  client.on('guildUpdate', (oldGuild, newGuild) => {
    debug(`Update for server "${oldGuild.name}" (${oldGuild.id})!`)
    if (newGuild.id !== oldGuild.id) {
      GUILD_MONITORS[newGuild.id] = GUILD_MONITORS[oldGuild.id]
      GUILD_MONITORS[oldGuild.id] = undefined
    }

    GUILD_MONITORS[newGuild.id].update(newGuild)
  })

  // Guild-specific events that need dispatch
  GuildMonitor.DISPATCH_EVENTS.forEach((eventStr) => {
    client.on(eventStr, (...args) => {
      // Get guild ID from first argument (always a 'guild' object)
      const guildID = args[0].id

      // Check that monitor exists
      if (!GUILD_MONITORS[guildID]) {
        debug(`ERROR: No active guild monitor for ${eventStr} event`)
        return
      }

      // Dispatch to specific monitor
      GUILD_MONITORS[guildID][eventStr](...args)
    })
  })
}

function setupMemberMonitor (client) {
  // Handle guildMember chunks
  client.on('guildMembersChunk', (members, guild, chunk) => {
    debug(`${members.size} member(s) added for "${guild.name}"`)
    members.each((member, memberId) => {
      if (MEMBER_MONITORS[memberId]) {
        debug(`WARNING: Member monitor already exists for "${member.name}", updating`)
        MEMBER_MONITORS[memberId].update(member, GUILD_MONITORS[guild.id])
      } else {
        MEMBER_MONITORS[memberId] = new MemberMonitor(member, GUILD_MONITORS[guild.id])
      }
    })
  })

  client.on('guildMemberAdd', (member) => {
    debug(`Member ${member.nickname} added to server "${member.guild.name}"`)
    MEMBER_MONITORS[member.id] = new MemberMonitor(member, GUILD_MONITORS[member.guild.id])
  })

  client.on('guildMemberRemove', (member) => {
    debug(`Member ${member.nickname} left/kicked from server "${member.guild.name}"`)
    MEMBER_MONITORS[member.id] = undefined
  })

  // Handle guildMember updates
  client.on('guildMemberUpdate', (oldMember, newMember) => {
    debug(`Update for server-member "${oldMember.name}" (${oldMember.id})!`)
    if (newMember.id !== oldMember.id) {
      MEMBER_MONITORS[newMember.id] = MEMBER_MONITORS[oldMember.id]
      MEMBER_MONITORS[oldMember.id] = undefined
    }

    MEMBER_MONITORS[newMember.id].update(newMember, GUILD_MONITORS[newMember.guild.id])
  })

  // GuildMember-specific events that need dispatch
  MemberMonitor.DISPATCH_EVENTS.forEach((eventStr) => {
    client.on(eventStr, (...args) => {
      // Get guildMember ID from first argument (always a 'guildMember' object)
      const memberID = args[0].id

      // Check that monitor exists
      if (!MEMBER_MONITORS[memberID]) {
        debug(`ERROR: No active member monitor for ${eventStr} event`)
        return
      }

      // Dispatch to specific monitor
      MEMBER_MONITORS[memberID][eventStr](...args)
    })
  })

  // Deal with presence changes
  client.on('presenceUpdate', (oldPres, newPres) => {
    debug('Old:', oldPres)
    debug('new:', newPres)
    // if (!MEMBER_MONITORS[newPres.member.id]) {
    //   debug('ERROR: No active member monitor for presence update event')
    //   return
    // }

    // // Note, oldPres might not be defined
    // MEMBER_MONITORS[newPres.member.id].presenceUpdate(newPres, oldPres)
  })
}
