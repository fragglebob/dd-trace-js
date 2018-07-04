'use strict'

class Scope {
  constructor (span, execution, finishSpanOnClose) {
    this._span = span
    this._execution = execution
    this._finishSpanOnClose = !!finishSpanOnClose
  }

  span () {
    return this._span
  }

  close () {
    if (this._finishSpanOnClose) {
      this._span.finish()
    }

    this._execution.remove(this)
  }
}

module.exports = Scope
