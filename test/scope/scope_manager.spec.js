'use strict'

const Scope = require('../../src/scope/scope')
const fs = require('fs')

describe('ScopeManager', () => {
  let ScopeManager
  let scopeManager
  let asyncHooks

  beforeEach(() => {
    asyncHooks = {
      createHook (hooks) {
        Object.keys(hooks).forEach(key => {
          this[key] = hooks[key]
        })

        return {
          enable: sinon.stub(),
          disable: sinon.stub()
        }
      }
    }

    // context = {
    //   active: null,
    //   parent: null,
    //   add: sinon.stub(),
    //   link: sinon.stub(),
    //   exit: sinon.stub()
    // }

    // Context = sinon.stub().returns(context)

    ScopeManager = proxyquire('../src/scope/scope_manager', {
      './async_hooks': asyncHooks
      // './context': Context
    })

    scopeManager = new ScopeManager()
  })

  afterEach(() => {
    scopeManager._disable()
  })

  it('should enable its hooks')

  it('should support activating a span', () => {
    const span = {}

    scopeManager.activate(span)

    expect(scopeManager.active()).to.not.be.undefined
    expect(scopeManager.active()).to.be.instanceof(Scope)
    expect(scopeManager.active().span()).to.equal(span)
  })

  it('should support closing a scope', () => {
    const span = {}
    const scope = scopeManager.activate(span)

    scope.close()

    expect(scopeManager.active()).to.be.null
  })

  it('should support multiple simultaneous scopes', () => {
    const span1 = {}
    const span2 = {}
    const scope1 = scopeManager.activate(span1)

    expect(scopeManager.active()).to.equal(scope1)

    const scope2 = scopeManager.activate(span2)

    expect(scopeManager.active()).to.equal(scope2)

    scope2.close()

    expect(scopeManager.active()).to.equal(scope1)

    scope1.close()

    expect(scopeManager.active()).to.be.null
  })

  it('should support automatically finishing the span on close', () => {
    const span = { finish: sinon.stub() }
    const scope = scopeManager.activate(span, true)

    scope.close()

    expect(span.finish).to.have.been.called
  })

  // it('should exit the context in the after hook', () => {

  // })

  it('should automatically close pending scopes when the context exits', () => {
    const span = {}

    asyncHooks.init(1)
    asyncHooks.before(1)

    const scope = scopeManager.activate(span)

    sinon.spy(scope, 'close')

    asyncHooks.after(1)

    expect(scope.close).to.have.been.called
  })

  // it('should wait the end of the asynchronous context before closing pending scopes', () => {
  //   const span = {}

  //   asyncHooks.init(1)
  //   asyncHooks.before(1)

  //   const scope = scopeManager.activate(span)

  //   sinon.spy(scope, 'close')

  //   asyncHooks.init(2)
  //   asyncHooks.after(1)
  //   asyncHooks.destroy(1)
  //   asyncHooks.before(2)

  //   expect(scope.close).to.not.have.been.called

  //   asyncHooks.after(2)
  //   asyncHooks.destroy(2)

  //   expect(scope.close).to.have.been.called
  // })

  it('should wait the end of the asynchronous context to close pending scopes', () => {
    const span = {}

    asyncHooks.init(1)
    asyncHooks.before(1)

    const scope = scopeManager.activate(span)

    sinon.spy(scope, 'close')

    asyncHooks.init(2)
    asyncHooks.after(1)
    asyncHooks.destroy(1)
    asyncHooks.before(2)

    expect(scope.close).to.not.have.been.called

    asyncHooks.init(3)
    asyncHooks.after(2)
    asyncHooks.destroy(2)
    asyncHooks.before(3)

    expect(scope.close).to.not.have.been.called

    asyncHooks.after(3)
    asyncHooks.destroy(3)

    expect(scope.close).to.have.been.called
  })

  // it('should prevent memory leaks in recursive timers', done => {
  //   const outerContext = scopeManager._active
  //   const outerChildCount = outerContext.children.size

  //   let innerContext
  //   let scope1
  //   let scope2
  //   let scope3

  //   function assert () {
  //     // fs.writeSync(1, `scope1: ${scope1._context.id}\n`)
  //     // fs.writeSync(1, `scope2: ${scope2._context.id}\n`)
  //     // fs.writeSync(1, `scope3: ${scope3._context.id}\n`)
  //     // fs.writeSync(1, `innerContext: ${innerContext.id}\n`)
  //     // fs.writeSync(1, `innerContext.parent: ${innerContext.parent.id}\n`)
  //     // fs.writeSync(1, `outlier: ${Array.from(outerContext.children.values())[2].id}\n`)
  //     // fs.writeSync(1, `outlier.parent: ${Array.from(outerContext.children.values())[2].parent.id}\n`)

  //     // expect(outerContext.children.size).to.equal(outerChildCount + 1)
  //     // expect(outerContext.children.get(scope3._context.id)).to.equal(scope3._context)
  //     // expect(scope1._context.parent).to.be.null
  //     fs.writeSync(1, `scope1 ${scope1._context.count}\n`)
  //     expect(scope1._context.children.size).to.equal(0)
  //     // expect(scope2._context.parent).to.be.null
  //     expect(scope2._context.children.size).to.equal(0)
  //     // expect(scope3._context.parent).to.equal(outerContext)
  //     expect(scope3._context.children.size).to.equal(1)
  //     // expect(scope3._context.children.values().next().value).to.equal(innerContext)
  //     // expect(innerContext.parent).to.equal(scope3._context)

  //     done()
  //   }

  //   setTimeout(() => {
  //     scope1 = scopeManager.activate({})

  //     setTimeout(() => {
  //       scope2 = scopeManager.activate({})

  //       setTimeout(() => {
  //         fs.writeSync(1, `scope1: ${scope1._context.parent}\n`)
  //         fs.writeSync(1, `scope1: ${scope1._context.count}\n`)
  //         scope1.close()
  //         fs.writeSync(1, `scope1: ${scope1._context.parent}\n`)

  //         scope3 = scopeManager.activate({})

  //         setTimeout(() => {
  //           scope2.close()

  //           setTimeout(() => {
  //             innerContext = scopeManager._active

  //             assert()

  //             scope3.close()
  //           })
  //         })
  //       })
  //     })
  //   })
  // })

  it('should propagate parent context to children', () => {
    const span = {}
    const scope = scopeManager.activate(span)

    asyncHooks.init(1)
    asyncHooks.before(1)

    expect(scopeManager.active()).to.equal(scope)
  })

  it('should propagate parent context to children', () => {
    const span = {}
    const scope = scopeManager.activate(span)

    asyncHooks.init(1)
    asyncHooks.before(1)

    expect(scopeManager.active()).to.equal(scope)
  })

  it('should isolate asynchronous contexts', () => {
    const span1 = {}
    const span2 = {}

    const scope1 = scopeManager.activate(span1)

    asyncHooks.init(1)
    asyncHooks.init(2)
    asyncHooks.before(1)

    scopeManager.activate(span2)

    asyncHooks.after(1)
    asyncHooks.before(2)

    expect(scopeManager.active()).to.equal(scope1)
  })

  it('should isolate reentering asynchronous contexts', () => {
    const span1 = {}
    const span2 = {}

    const scope1 = scopeManager.activate(span1)

    asyncHooks.init(1)
    asyncHooks.before(1)

    scopeManager.activate(span2)

    asyncHooks.after(1)
    asyncHooks.before(1)

    expect(scopeManager.active()).to.equal(scope1)

    asyncHooks.after(1)
  })

  it('should properly relink children of an exited context', () => {
    const scope1 = scopeManager.activate({})

    asyncHooks.init(1)
    asyncHooks.before(1)

    const scope2 = scopeManager.activate({})

    asyncHooks.init(2)
    asyncHooks.after(1)
    asyncHooks.before(2)

    scopeManager.activate({})
    scope2.close()

    asyncHooks.after(2)
    asyncHooks.before(2)

    expect(scopeManager.active()).to.equal(scope1)
  })

//   it('should prevent memory leaks', (done) => {
//     const memwatch = require('memwatch-next')
//     const hd = new memwatch.HeapDiff()

//     const scope1 = scopeManager.activate({})

//     asyncHooks.init(1)
//     asyncHooks.before(1)

//     const scope2 = scopeManager.activate({})

//     asyncHooks.init(2)
//     asyncHooks.after(1)
//     asyncHooks.destroy(1)
//     asyncHooks.before(2)

//     const scope3 = scopeManager.activate({})

//     scope2.close()

//     asyncHooks.after(2)
//     asyncHooks.before(2)
//     asyncHooks.after(2)
//     asyncHooks.destroy(2)

//     scope1.close()
//     scope3.close()

//     setTimeout(() => {
//       const diff = hd.end()
//       const contextDiff = diff.change.details.find(detail => detail.what === 'Context')

//       expect(contextDiff).to.be.undefined

//       done()
//     })
//   }).timeout(30000)
})
