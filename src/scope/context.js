'use strict'

const asyncHooks = require('async_hooks')

class Context {
  constructor () {
    this._id = Math.random()
    this.parent = null
    this.children = new Set()
    this.active = null
    this.count = 1
    this.destroyed = false
    this.set = []
  }

  retain () {
    // require('fs').writeSync(1, `retain: ${this._id} (${this.count})\n`)
    this.count++
  }

  release () {
    // require('fs').writeSync(1, `release: ${this._id} (${this.count})\n`)
    this.count--

    // if (this.count === 0) {
    this.destroy()
    // }
  }

  add (scope) {
    this.set.push(scope)
    this.active = scope
  }

  remove (scope) {
    const index = this.set.lastIndexOf(scope)

    this.set.splice(index, 1)
    this.active = this.set[this.set.length - 1]

    if (!this.active) {
      this.bypass()
    }
  }

  exit () {
    this.exited = true
    this.release()
  }

  close () {
    if (this.count === 0) {
      for (let i = this.set.length - 1; i >= 0; i--) {
        this.set[i].close()
      }
    }
  }

  destroy () {
    if (this.set.length === 0) {
      this.bypass()
    } else if (this.count === 0) {
      this.close()
    }
  }

  link (parent) {
    if (parent) {
      this.parent = parent
      this.parent.attach(this)
    }
  }

  unlink () {
    if (this.parent) {
      this.parent.detach(this)
      this.parent = null
    }
  }

  relink (parent) {
    this.unlink()
    this.link(parent)
  }

  attach (child) {
    this.children.add(child)
    this.retain()
  }

  detach (child) {
    this.children.delete(child)
    this.release()
  }

  bypass () {
    if (this.exited) {
      this.children.forEach(child => child.relink(this.parent))
      this.unlink()
    }
  }
}

module.exports = Context
