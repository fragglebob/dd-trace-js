'use strict'

class Context {
  constructor (id) {
    this.id = id
    this.parent = null
    this.children = new Map()
    this.active = null
    this.count = 0
    this.exited = false
    this.destroyed = false
    this.set = []
  }

  retain () {
    this.count++
  }

  release () {
    this.count--
  }

  exit (scope) {
    const index = this.set.lastIndexOf(scope)

    this.set.splice(index, 1)
    this.active = this.set[this.set.length - 1]

    if (!this.active) {
      this.destroy()
    }
  }

  close () {
    if (this.count === 0) {
      for (let i = this.set.length - 1; i >= 0; i--) {
        this.set[i].close()
      }
    }
  }

  remove () {
    if (this.set.length === 0) {
      this.destroy()
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
      this.parent.children.delete(this.id)
      this.parent.release()
      this.parent = null
    }
  }

  attach (child) {
    this.children.set(child.id, child)
    this.retain()
  }

  detach (child) {
    child.parent = this.parent
    this.parent.children.set(child.id, child)
    this.parent.retain()
    this.release()
  }

  bypass () {
    this.children.forEach(child => this.detach(child))
    this.children.clear()
  }

  destroy () {
    if (this.parent) {
      this.bypass()
      this.count = -1

      if (this.destroyed) {
        const parent = this.parent

        this.unlink()

        parent.remove()
      }
    }
  }
}

module.exports = Context
