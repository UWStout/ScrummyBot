// Import mongodb libraries
// import { ClientEncryption } from 'mongodb-client-encryption'
import { MongoClient } from 'mongodb'

// Read extra environment variables from the .env file
import dotenv from 'dotenv'

// Utility to print messages only during dev
import Debug from 'debug'

// Import parent command object
import Command from './Command.js'

// Create database urls
const DEV_DB_URL = 'mongodb://localhost:27017/ScrummyData'
const PROD_DB_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@profberriercluster.zzyhu.mongodb.net/ScrummyData?retryWrites=true&w=majority`

// Setup debug output object
const debug = Debug('bot:db_command_base')

// Load .env config (contains DB login credentials)
dotenv.config()

class DBCommandBase extends Command {
  constructor (name, alias, description) {
    super(name, alias, description)

    // Make sure a DB connection exists
    this.checkConnection()
  }

  // Instance level function for checking and establishing a MongoDB connection
  async checkConnection () {
    // If there's no handle and we aren't already connecting
    if (!DBCommandBase.CLIENT_HANDLE && !DBCommandBase.CONNECTING) {
      // Set connecting flag to true
      DBCommandBase.CONNECTING = true

      // Try to await the connection promise
      try {
        await DBCommandBase.connect()
      } catch (err) {
        // Report error
        console.error('Something went wrong during DB connection')
        console.error(err)
      }

      // Clear connecting flag
      DBCommandBase.CONNECTING = false
    }
  }

  // Easy access to database handle
  static get db () {
    if (!DBCommandBase.CLIENT_HANDLE) {
      throw new Error('Can\'t retrieve database handle, no connection to Server.')
    }
    return DBCommandBase.CLIENT_HANDLE.db('ScrummyData')
  }

  // Promise function to connect to MongoDB
  static connect () {
    // Is there an existing connection
    if (!DBCommandBase.CLIENT_HANDLE) {
      return new Promise((resolve, reject) => {
        // Attempt to connect
        const URL = (_DEV_ ? DEV_DB_URL : PROD_DB_URL)
        debug(`Connecting to MongoDB '${_DEV_ ? 'DEV server' : 'PROD server'}'`)
        const connectPromise = MongoClient.connect(URL, { useUnifiedTopology: true, useNewUrlParser: true })
        connectPromise.then((result) => {
          DBCommandBase.CLIENT_HANDLE = result
          debug('Connected to database')
        }).catch((err) => {
          console.error('CRITICAL: Database connection failed')
          return reject(err)
        })
      })
    }

    // Connection already exists
    debug('Reusing existing MongoDB connection')
    return Promise.resolve(DBCommandBase.CLIENT_HANDLE)
  }

  // Promise function to disconnect from MongoDB
  static disconnect () {
    // Is there an open database handle to close
    if (!DBCommandBase.CLIENT_HANDLE) {
      return Promise.resolve(false)
    }

    // Close the client connection handle
    return new Promise((resolve, reject) => {
      debug('Closing mongoDB database ...')
      const closePromise = DBCommandBase.CLIENT_HANDLE.close()
      closePromise.then(() => {
        DBCommandBase.CLIENT_HANDLE = null
        debug('MongoDB connection closed.')
        return resolve(true)
      }).catch((err) => {
        debug('Failed to close MongoDB connection')
        debug(err)
        return reject(err)
      })
    })
  }
}

// The global connection to the mongo-client API
DBCommandBase.CLIENT_HANDLE = null

// Flag to indicating that connection is in process
DBCommandBase.CONNECTING = false

export default DBCommandBase
