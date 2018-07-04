'use strict'

const asyncHooks = require('./async_hooks')
const Scope = require('./scope')
const Context = require('./context')

class ScopeManager {
  constructor () {
    const id = -1
    const context = new Context()

    this._active = context
    this._stack = []
    this._links = new Map()
    this._contexts = new Map([[ id, context ]])

    this._hook = asyncHooks.createHook({
      init: this._init.bind(this),
      before: this._before.bind(this),
      after: this._after.bind(this),
      destroy: this._destroy.bind(this),
      promiseResolve: this._promiseResolve.bind(this)
    })

    this._enable()
  }

  active () {
    let context = this._active

    while (context !== null) {
      if (context.active) {
        return context.active
      }

      context = context.parent
    }

    return null
  }

  activate (span, finishSpanOnClose) {
    const context = this._active
    const scope = new Scope(span, context, finishSpanOnClose)

    context.add(scope)

    return scope
  }

  _init (asyncId) {
    this._links.set(asyncId, this._active)
    this._active.retain()
  }

  _before (asyncId) {
    const parent = this._links.get(asyncId)

    if (parent) {
      const context = new Context()

      context.link(parent)

      this._stack.push(this._active)
      this._contexts.set(asyncId, context)
      this._active = context
    }
  }

  _after (asyncId) {
    const context = this._contexts.get(asyncId)

    if (context) {
      context.exit()

      this._active = this._stack.pop()
      this._contexts.delete(asyncId)
    }
  }

  _destroy (asyncId) {
    const parent = this._links.get(asyncId)

    if (parent) {
      this._links.delete(asyncId)
      parent.release()
    }
  }

  _promiseResolve (asyncId) {
    this._destroy(asyncId)
  }

  _enable () {
    this._hook.enable()
  }

  _disable () {
    this._hook.disable()
  }
}

module.exports = ScopeManager
