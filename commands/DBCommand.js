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
          return resolve(result._id)
        })
    })
  }

  createUser (discordID, discordName) {
    return new Promise((resolve, reject) => {
      DBCommandBase.db.collection('Users')
        .insertOne({ discordID, discordName, lastPunch: null }, (err, result) => {
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

  getUserTimeCard (dbID, serverID) {
    return new Promise((resolve, reject) => {
      // Retrieve a punch card with only entries for this server
      DBCommandBase.db.collection('Users')
        .aggregate([
          { $match: { _id: dbID } },
          {
            $project: {
              timeCard: {
                $filter: {
                  input: '$timeCard',
                  as: 'punch',
                  cond: { $eq: ['$$punch.serverID', serverID] }
                }
              }
            }
          }
        ], (err, cursor) => {
          // Check for and handle error
          if (err || !cursor) {
            debug('Error getting user\'s last punch')
            debug(err)
            return reject(err)
          }

          cursor.toArray((err, doc) => {
            if (err) {
              debug('Error converting to array')
              debug(err)
              return reject(err)
            }

            // If nothing found, return empty array
            if (!doc || !doc[0] || !doc[0].timeCard) {
              return resolve([])
            }

            // return the filtered time card
            return resolve(doc[0].timeCard)
          })
        })
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
      const punchObj = { serverID, punch: punchStr, time: new Date() }
      DBCommandBase.db.collection('Users')
        .updateOne(
          { _id: dbID },
          { $push: { timeCard: punchObj } },
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
