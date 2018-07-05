'use strict'

describe('ContextExecution', () => {
  let ContextExecution
  let execution
  let Context
  let context
  let scopes
  let parent
  let children

  beforeEach(() => {
    context = {
      parent: sinon.stub(),
      retain: sinon.stub(),
      release: sinon.stub(),
      link: sinon.stub(),
      unlink: sinon.stub(),
      relink: sinon.stub()
    }

    children = [1, 2, 3].map(() => ({
      parent: sinon.stub(),
      link: sinon.stub(),
      unlink: sinon.stub(),
      relink: sinon.stub()
    }))

    scopes = [1, 2, 3].map(() => ({ close: sinon.stub() }))

    ContextExecution = require('../../src/scope/context_execution')

    execution = new ContextExecution(context)
  })

  it('should close pending scopes on exit with no children', () => {
    execution.add(scopes[0])
    execution.add(scopes[1])

    execution.exit()

    expect(scopes[0].close).to.have.been.called
    expect(scopes[1].close).to.have.been.called
  })

  it('should relink children to its parent on exit when empty', () => {
    const parent = {}

    context.parent.returns(parent)

    execution.attach(children[0])
    execution.attach(children[1])

    execution.exit()

    expect(children[0].relink).to.have.been.calledWith(parent)
    expect(children[1].relink).to.have.been.calledWith(parent)
  })

  // it('should link non-empty children to its parent when exited and empty', () => {
  //   context.link(parent)

  //   children[0].link(context)
  //   children[0].add(scopes[0])

  //   sinon.spy(parent, 'attach')

  //   context.exit()

  //   expect(parent.attach).to.have.been.calledWith(children[0])
  // })

  // it('should prevent memory leaks in ', () => {
  //   context.link(parent)

  //   children[0].link(context)
  //   children[0].add(scopes[0])

  //   sinon.spy(parent, 'attach')

  //   context.exit()

  //   expect(parent.attach).to.have.been.calledWith(children[0])
  // })
})
