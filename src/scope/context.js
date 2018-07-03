'use strict'

const asyncHooks = require('async_hooks')

class Context {
  constructor () {
    this._id = Math.random()
    this.parent = null
    this.children = new Set()
    this.active = null
    this.count = 0
    this.destroyed = false
    this.set = []
  }

  retain () {
    require('fs').writeSync(1, `retain: ${this._id} (${this.count})\n`)
    this.count++
  }

  release () {
    require('fs').writeSync(1, `release: ${this._id} (${this.count})\n`)
    this.count--

    // if (this.count === 0) {
    //   // this.parent.release()
    //   this.unlink()
    // }
  }

  exit (scope) {
    const index = this.set.lastIndexOf(scope)

    this.set.splice(index, 1)
    this.active = this.set[this.set.length - 1]

    if (!this.active) {
      this.bypass()
    }
  }

  close () {
    require('fs').writeSync(1, `close: ${this._id} (${this.count})\n`)
    if (this.count === 0) {
      for (let i = this.set.length - 1; i >= 0; i--) {
        this.set[i].close()
      }
    }
  }

  destroy () {
    this.destroyed = true

    if (this.set.length === 0) {
      this.bypass()
    } else {
      this.close()
    }
  }

  link (parent) {
    this.parent = parent
    this.parent.attach(this)
  }

  unlink () {
    if (this.parent) {
      this.parent.children.delete(this)
      this.parent.release()
      this.parent = null
    }
  }

  attach (child) {
    this.children.add(child)
    this.retain()
  }

  detach (child) {
    if (this.parent) {
      child.parent = this.parent
      this.parent.children.add(child)
      this.parent.retain()
      this.children.delete(child)
      this.release()
    }
  }

  bypass () {
    if (this.destroyed && this.count === 0) {
      this.children.forEach(child => this.detach(child))
      this.unlink()
      // this.parent.detach(this)
    }
  }
}

module.exports = Context
