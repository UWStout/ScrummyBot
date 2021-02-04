class Command {
  // Initialize the name and description properties (which are immutable)
  constructor (name, alias = [], params = [], description = '') {
    this._name = name
    if (Array.isArray(alias)) {
      this._alias = alias
    } else {
      this._alias = [alias]
    }

    if (Array.isArray(params)) {
      this._params = params
    } else {
      this._params = [params]
    }

    if (Array.isArray(description)) {
      this._description = description
    } else {
      this._description = [description]
    }
  }

  // Provide getters only for name, alias, and description
  get name () { return this._name }
  get alias () { return this._alias }
  get params () { return this._params }
  get description () { return this._description }

  // The primary function that is run when this command is triggered
  execute (msg, args) {
    console.error('WARNING: Abstract Command.execute() called')
  }
}

// Expose this class for import in other files
export default Command
