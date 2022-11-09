import dotenv from 'dotenv'
import Debug from 'debug'

import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'

// Setup debug output object
const debug = Debug('bot:db_helper')

// Running in dev mode?
const _DEV_ = process.argv.some(arg => arg.toLowerCase() === 'dev')

// Load .env config (contains DB login credentials)
dotenv.config()

// Basic DB setup/config
const DB_NAME = (_DEV_ ? process.env.DEV_DB_NAME : process.env.PROD_DB_NAME) || 'ScrummyData'
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@berriercluster.m5otq.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
})

export async function checkIfUserExists (discordID) {
  try {
    // Connect and perform query
    await client.connect()
    const result = await client.db(DB_NAME).collection('Users').findOne({ discordID })

    // Check if the user was found
    if (!result) { return null }
    return result._id
  } catch (err) {
    // Log error
    debug('Error checking for user')
    debug(err)
    return null
  }
}

export async function createUser (discordID, discordName) {
  try {
    // Connect and perform query
    await client.connect()
    const result = await client.db(DB_NAME).collection('Users').insertOne({
      discordID, discordName
    })

    // Check result and return new id
    if (!result.acknowledged) {
      throw new Error('Insert was not acknowledged')
    }
    return result.insertedId
  } catch (err) {
    // Log error
    debug('Error creating user')
    debug(err)
    return null
  }
}

export async function getUsersOnServer (serverID) {
  // Build query object for existence
  const fieldMatch = {}
  fieldMatch[`timeCard.${serverID}`] = { $exists: true }

  try {
    // Connect and perform query
    await client.connect()
    const cursor = client.db(DB_NAME).collection('Users')
      .aggregate([
        { $match: fieldMatch },
        { $project: { discordName: 1, timeCard: { $last: `$timeCard.${serverID}` } } }
      ])

    // Return all the results if any
    const docs = await cursor.toArray()
    if (!docs || !Array.isArray(docs)) {
      return []
    }
    return docs
  } catch (err) {
    // Log error
    debug('Error getting users on server')
    debug(err)
    return []
  }
}

export async function getServerDataInRange (start, end, firstID, secondID) {
  // Check parameters
  // - If secondID is undefined/nullish then treat firstID as serverID
  // - If secondID is not null, then treat it as the serverID and the first as the userID
  const serverID = secondID || firstID
  const userID = (secondID ? firstID : null)

  // Build query object for existence of server and for userID if it was provided
  const fieldMatch = {}
  fieldMatch[`timeCard.${serverID}`] = { $exists: true }
  if (userID) { fieldMatch._id = userID }

  try {
    // Connect and perform query
    await client.connect()
    const cursor = client.db(DB_NAME).collection('Users')
      .aggregate([
        // Grab only the timecard of this server (and possibly only one user)
        { $match: fieldMatch },

        // Filter out time card entries not in date range (and other user fields)
        {
          $project: {
            discordName: 1,
            timeCard: {
              $filter: {
                input: `$timeCard.${serverID}`,
                as: 'punch',
                cond: {
                  $and: [
                    { $gte: ['$$punch.time', start] },
                    { $lte: ['$$punch.time', end] }
                  ]
                }
              }
            }
          }
        },

        // Merge the user fields into the time card entires as one object
        { $unwind: '$timeCard' },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ['$$ROOT', '$timeCard'] }
          }
        },
        { $project: { timeCard: 0 } }
      ])

    // Return the results if any
    const docs = await cursor.toArray()
    if (!docs || !Array.isArray(docs)) {
      return []
    }
    return docs
  } catch (err) {
    // Log error
    debug('Error getting data in range')
    debug(err)
    return []
  }
}

export async function getOldUsers () {
  try {
    // Connect and perform query
    await client.connect()
    const cursor = client.db(DB_NAME).collection('Users')
      .aggregate([
        { $match: { timeCardVersion: 1 } },
        { $project: { _id: 1 } }
      ])

    const docs = await cursor.toArray()

    // If nothing found, return empty array
    if (!docs || !Array.isArray(docs)) {
      return []
    }
    return docs
  } catch (err) {
    // Log error
    debug('Error getting old users')
    debug(err)
    return []
  }
}

export async function getUserTimeCard (dbID, serverID) {
  try {
    // Connect and perform query
    await client.connect()
    const result = await client.db(DB_NAME).collection('Users')
      .findOne({ _id: new ObjectId(dbID) }, { projection: { timeCard: `$timeCard.${serverID}` } })

    // If nothing found, return empty array
    if (!result?.timeCard) {
      return []
    }

    return result.timeCard
  } catch (err) {
    // Log error
    debug('Error retrieving timecard')
    debug(err)
    return []
  }
}

export async function setUserTimecard (dbID, serverID, newTimeCard) {
  // Setup the timecard with a custom field name
  const setObj = {}
  setObj[`timeCard.${serverID}`] = newTimeCard

  try {
    // Connect and perform query
    await client.connect()
    const result = await client.db(DB_NAME).collection('Users')
      .updateOne({ _id: dbID }, { $set: setObj })

    if (!result?.acknowledged || result?.modifiedCount !== 1) {
      throw new Error('Query not acknowledged or incorrect modified count')
    }
  } catch (err) {
    // Log error
    debug('Error setting/updating timecard')
    debug(err)
  }
}

export async function getLastPunch (dbID, serverID) {
  try {
    // Get the proper timecard for this user
    const timeCard = await getUserTimeCard(dbID, serverID)

    // Return last entry (which will be most recent punch)
    if (timeCard.length > 0) {
      return timeCard[timeCard.length - 1]
    }

    // If none found, return empty
    return {}
  } catch (err) {
    // Log error
    debug('Error getting last punch')
    debug(err)
  }
}

export async function punchUserTimeCard (dbID, serverID, punchStr) {
  const pushOp = {}
  pushOp[`timeCard.${serverID}`] = { punch: punchStr, time: new Date() }

  try {
    // Connect and perform query
    await client.connect()
    const result = await client.db(DB_NAME).collection('Users')
      .updateOne({ _id: dbID }, { $push: pushOp })

    // Check the results
    if (!result?.acknowledged || result?.modifiedCount !== 1) {
      throw new Error('Time Card Punch failed to modify an entry')
    }

    // Resolve on success
    return true
  } catch (err) {
    // Log error
    debug('Failed to punch timecard')
    debug(err)
    return false
  }
}
