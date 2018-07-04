'use strict'

class Context {
  constructor () {
    this._parent = null
  }

  parent () {
    return this._parent
  }

  link (parent) {
    this._parent = parent
    this._parent.attach(this)
  }

  unlink () {
    this._parent.detach(this)
    this._parent = null
  }

  relink (parent) {
    this.unlink()
    this.link(parent)
  }
}

module.exports = Context
