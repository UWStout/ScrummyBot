class Command {
  // Initialize the name and description properties (which are immutable)
  constructor (name, alias = [], description = '') {
    this._name = name
    if (Array.isArray(alias)) {
      this._alias = alias
    } else {
      this._alias = []
      if (typeof alias === 'string') {
        description = alias
      }
    }

    this._description = description
  }

  // Provide getters only for name, alias, and description
  get name () { return this._name }
  get alias () { return this._alias }
  get description () { return this._description }

  // The primary function that is run when this command is triggered
  execute (msg, args) {
    console.error('WARNING: Abstract Command.execute() called')
  }
}

// Expose this class for import in other files
export default Command
