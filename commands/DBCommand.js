// Utility to print messages only during dev
import Debug from 'debug'

// Import parent command object
import DBCommandBase from './DBCommandBase.js'

// Setup debug output object
const debug = Debug('bot:db_command')

class DBCommand extends DBCommandBase {
  checkIfUserExists (discordID) {
    return new Promise((resolve, reject) => {
      DBCommandBase.db.collection('Users')
        .findOne({ discordID }, (err, result) => {
          // Check for and handle error
          if (err) {
            debug('Error checking for user')
            debug(err)
            return reject(err)
          }

          // Check if the user was found
          if (!result) { return resolve(false) }

          // Upgrade user timecard if needed
          if (result.timeCardVersion === 1) {
            this.upgradeUserTimeCard(result._id)
              .then((result) => { return resolve(result._id) })
              .catch((err) => {
                debug('Error upgrading timecard')
                debug(err)
                return reject(err)
              })
          } else {
            return resolve(result._id)
          }
        })
    })
  }

  createUser (discordID, discordName) {
    return new Promise((resolve, reject) => {
      DBCommandBase.db.collection('Users')
        .insertOne({ discordID, discordName }, (err, result) => {
          // Check for and handle error
          if (err) {
            debug('Error creating user')
            debug(err)
            return reject(err)
          }

          // Return _id of the inserted doc
          return resolve(result.insertedId)
        })
    })
  }

  upgradeUserTimeCard (dbID) {
    return new Promise((resolve, reject) => {
      DBCommandBase.db.collection('Users')
        .aggregate([
          // Match one entry by ID
          { $match: { _id: dbID } },

          // Convert time-card array to separate documents
          { $unwind: { path: '$timeCard' } },

          // Project out everything except timeCard entries and indexes
          { $project: { _id: 0, timeCard: 1 } }
        ], (err, cursor) => {
          // Check for and handle error
          if (err || !cursor) {
            debug('Error getting user\'s time card')
            debug(err)
            return reject(err)
          }

          cursor.toArray((err, docs) => {
            // Check for and handle error
            if (err) {
              debug('Error converting time card cursor to array for update')
              debug(err)
              return reject(err)
            }

            // Group time card by server ID
            const newTimeCard = docs.reduce((accumulate, curVal) => {
              if (!accumulate[curVal.timeCard.serverID]) { accumulate[curVal.timeCard.serverID] = [] }
              accumulate[curVal.timeCard.serverID].push({
                punch: curVal.timeCard.punch,
                time: curVal.timeCard.time
              })
              return accumulate
            }, {})

            // Update user entry with new time card
            DBCommandBase.db.collection('Users').updateOne(
              { _id: dbID },
              { $set: { timeCardVersion: 2, timeCard: newTimeCard } },
              (err, result) => {
                // Check for and handle error
                if (err) {
                  debug('Error updating time card')
                  debug(err)
                  return reject(err)
                }

                // Check if the user was found
                if (result.modifiedCount !== 1) { return resolve(false) }
                return resolve(true)
              }
            )
          })
        })
    })
  }

  getUsersOnServer (serverID) {
    // Build query object for existence
    const fieldMatch = {}
    fieldMatch[`timeCard.${serverID}`] = { $exists: true }

    return new Promise((resolve, reject) => {
      // Retrieve a punch card with only entries for this server
      DBCommandBase.db.collection('Users')
        .aggregate([
          { $match: fieldMatch },
          { $project: { discordName: 1, timeCard: { $last: `$timeCard.${serverID}` } } }
        ], (err, cursor) => {
          // Check for and handle errors
          if (err) {
            debug('Error retrieving users on server')
            debug(err)
            return reject(err)
          }

          cursor.toArray((err, docs) => {
            // Check for and handle errors
            if (err) {
              debug('Converting users to array')
              debug(err)
              return reject(err)
            }

            // If nothing found, return empty array
            if (!docs || !Array.isArray(docs)) {
              return resolve([])
            }

            // Return the users
            return resolve(docs)
          })
        })
    })
  }

  getOldUsers () {
    return new Promise((resolve, reject) => {
      // Retrieve a punch card with only entries for this server
      DBCommandBase.db.collection('Users')
        .aggregate([
          { $match: { timeCardVersion: 1 } },
          { $project: { _id: 1 } }
        ], (err, cursor) => {
          // Check for and handle errors
          if (err) {
            debug('Error retrieving old users on server')
            debug(err)
            return reject(err)
          }

          cursor.toArray((err, docs) => {
            // Check for and handle errors
            if (err) {
              debug('Error converting old users to array')
              debug(err)
              return reject(err)
            }

            // If nothing found, return empty array
            if (!docs || !Array.isArray(docs)) {
              return resolve([])
            }

            // Return the users
            return resolve(docs)
          })
        })
    })
  }

  getUserTimeCard (dbID, serverID) {
    return new Promise((resolve, reject) => {
      // Retrieve a punch card with only entries for this server
      DBCommandBase.db.collection('Users')
        .findOne({ _id: dbID },
          { projection: { timeCard: `$timeCard.${serverID}` } },
          (err, result) => {
            // Check for and handle errors
            if (err) {
              debug('Error retrieving timecard')
              debug(err)
              return reject(err)
            }

            // If nothing found, return empty array
            if (!result || !result.timeCard) {
              return resolve([])
            }

            // Return the extracted timecard
            return resolve(result.timeCard)
          }
        )
    })
  }

  setUserTimecard (dbID, serverID, newTimeCard) {
    // Setup the timecard with a custom field name
    const setObj = {}
    setObj[`timeCard.${serverID}`] = newTimeCard

    return new Promise((resolve, reject) => {
      // Retrieve a punch card with only entries for this server
      DBCommandBase.db.collection('Users')
        .updateOne({ _id: dbID },
          { $set: setObj },
          (err, result) => {
            // Check for and handle errors
            if (err || !result || result.modifiedCount !== 1) {
              debug('Error setting/updating timecard')
              debug(err)
              return reject(err)
            }

            // Resolve to indicate success
            return resolve()
          }
        )
    })
  }

  getLastPunch (dbID, serverID) {
    return new Promise((resolve, reject) => {
      this.getUserTimeCard(dbID, serverID).then((timeCard) => {
        // Return last entry (which will be most recent punch)
        if (timeCard.length > 0) {
          return resolve(timeCard[timeCard.length - 1])
        }

        // If none found, return empty
        return resolve({})
      }).catch((err) => {
        return reject(err)
      })
    })
  }

  punchUserTimeCard (dbID, serverID, punchStr) {
    return new Promise((resolve, reject) => {
      const pushOp = {}
      pushOp[`timeCard.${serverID}`] = { punch: punchStr, time: new Date() }
      DBCommandBase.db.collection('Users')
        .updateOne(
          { _id: dbID },
          { $push: pushOp },
          (err, result) => {
            // Check for and handle error
            if (err) {
              debug('Error punching time card')
              debug(err)
              return reject(err)
            }

            // Check the results
            if (result.modifiedCount !== 1) {
              return reject(new Error('Time Card Punch failed to modify an entry'))
            }

            // Resolve on success
            return resolve(true)
          }
        )
    })
  }
}

export default DBCommand
