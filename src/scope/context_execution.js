'use strict'

const asyncHooks = require('async_hooks')

class ContextExecution {
  constructor (context) {
    this._context = context
    this._children = new Set()
    this._active = null
    this._count = 1
    this._exited = false
    this._set = []

    if (context) {
      context.retain()
    }
  }

  retain () {
    // require('fs').writeSync(1, `retain: ${this._id} (${this._count})\n`)
    this._count++
  }

  release () {
    // require('fs').writeSync(1, `release: ${this._id} (${this._count})\n`)
    this._count--

    // if (this._count === 0) {
    this._destroy()
    // }
  }

  parent () {
    return this._context ? this._context.parent() : null
  }

  scope () {
    return this._active
  }

  add (scope) {
    this._set.push(scope)
    this._active = scope
  }

  remove (scope) {
    const index = this._set.lastIndexOf(scope)

    this._set.splice(index, 1)
    this._active = this._set[this._set.length - 1]

    if (!this._active) {
      this._bypass()
    }
  }

  exit () {
    this._exited = true
    this.release()
  }

  attach (child) {
    this._children.add(child)
    this.retain()
  }

  detach (child) {
    this._children.delete(child)
    this.release()
  }

  _close () {
    if (this._count === 0) {
      for (let i = this._set.length - 1; i >= 0; i--) {
        this._set[i].close()
      }
    }
  }

  _destroy () {
    if (this._set.length === 0) {
      this._bypass()
    } else {
      this._close()
    }
  }

  _bypass () {
    if (this._exited) {
      this._children.forEach(child => child.relink(this._context.parent()))
      this._context.release()
    }
  }
}

module.exports = ContextExecution
