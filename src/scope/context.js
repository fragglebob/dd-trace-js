'use strict'

class Context {
  constructor () {
    this._parent = null
    this._count = 0
  }

  retain () {
    this._count++
  }

  release () {
    this._count--
    this.destroy()
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

  destroy () {
    if (this._count === 0) {
      this.unlink()
    }
  }
}

module.exports = Context
