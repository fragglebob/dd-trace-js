'use strict'

const asyncHooks = require('./async_hooks')
const Scope = require('./scope')
const Context = require('./context')
const ContextExecution = require('./context_execution')

class ScopeManager {
  constructor () {
    const id = -1
    const execution = new ContextExecution()

    this._active = execution
    this._stack = []
    this._contexts = new Map()
    this._executions = new Map([[ id, execution ]])

    this._hook = asyncHooks.createHook({
      init: this._init.bind(this),
      before: this._before.bind(this),
      after: this._after.bind(this),
      destroy: this._destroy.bind(this),
      promiseResolve: this._destroy.bind(this)
    })

    this._enable()
  }

  active () {
    let execution = this._active

    while (execution !== null) {
      if (execution.scope()) {
        return execution.scope()
      }

      execution = execution.parent()
    }

    return null
  }

  activate (span, finishSpanOnClose) {
    const execution = this._active
    const scope = new Scope(span, execution, finishSpanOnClose)

    execution.add(scope)

    return scope
  }

  _init (asyncId) {
    const context = new Context()

    context.link(this._active)
    context.retain()

    this._contexts.set(asyncId, context)
  }

  _before (asyncId) {
    const context = this._contexts.get(asyncId)

    if (context) {
      const execution = new ContextExecution(context)

      this._stack.push(this._active)
      this._executions.set(asyncId, execution)
      this._active = execution
    }
  }

  _after (asyncId) {
    const execution = this._executions.get(asyncId)

    if (execution) {
      execution.exit()

      this._active = this._stack.pop()
      this._executions.delete(asyncId)
    }
  }

  _destroy (asyncId) {
    const context = this._contexts.get(asyncId)

    if (context) {
      this._contexts.delete(asyncId)
      context.release()
    }
  }

  _enable () {
    this._hook.enable()
  }

  _disable () {
    this._hook.disable()
  }
}

module.exports = ScopeManager
