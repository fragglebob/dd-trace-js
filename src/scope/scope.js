'use strict'

class Scope {
  constructor (span, context, finishSpanOnClose) {
    this._span = span
    this._context = context
    this._finishSpanOnClose = !!finishSpanOnClose
  }

  span () {
    return this._span
  }

  close () {
    if (this._finishSpanOnClose) {
      this._span.finish()
    }

    this._context.remove(this)
  }
}

module.exports = Scope
