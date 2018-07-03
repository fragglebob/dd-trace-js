'use strict'

const asyncHooks = require('./async_hooks')
const Scope = require('./scope')
const Context = require('./context')

class ScopeManager {
  constructor () {
    const context = new Context()

    this._active = context
    this._stack = []
    this._links = new Map()

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

    context.set.push(scope)
    context.active = scope

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

      this._enter(context)
    }
  }

  _after (asyncId) {
    if (this._links.has(asyncId)) {
      this._exit(this._active)
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

  _enter (context) {
    this._stack.push(this._active)
    this._active = context
  }

  _exit (context) {
    this._active = this._stack.pop()

    context.destroy()
  }

  _enable () {
    this._hook.enable()
  }

  _disable () {
    this._hook.disable()
  }
}

module.exports = ScopeManager
