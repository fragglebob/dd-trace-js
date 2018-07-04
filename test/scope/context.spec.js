'use strict'

describe('Context', () => {
  let Context
  let context
  let scopes
  let parent
  let ancestor
  let children

  beforeEach(() => {
    Context = require('../../src/scope/context')

    context = new Context()
    parent = new Context()
    ancestor = new Context()
    children = [1, 2, 3].map(() => new Context())

    scopes = [1, 2, 3].map(() => ({ close: sinon.stub() }))
  })

  it('should close pending scopes on exit with no children', () => {
    context.add(scopes[0])
    context.add(scopes[1])

    context.exit()

    expect(scopes[0].close).to.have.been.called
    expect(scopes[1].close).to.have.been.called
  })

  it('should bypass an empty exited context', () => {
    context.link(parent)

    children[0].link(context)
    children[1].link(context)

    sinon.spy(parent, 'release')
    sinon.spy(parent, 'attach')

    context.exit()

    children[0].release()
    children[1].release()

    expect(parent.attach).to.have.been.calledWith(children[0])
    expect(parent.attach).to.have.been.calledWith(children[1])
    expect(parent.release).to.have.been.called
  })

  it('should link non-empty children to its when exited and empty', () => {
    context.link(parent)

    children[0].link(context)
    children[0].add(scopes[0])

    sinon.spy(parent, 'attach')

    context.exit()

    expect(parent.attach).to.have.been.calledWith(children[0])
  })

  it('should prevent memory leaks in ', () => {
    context.link(parent)

    children[0].link(context)
    children[0].add(scopes[0])

    sinon.spy(parent, 'attach')

    context.exit()

    expect(parent.attach).to.have.been.calledWith(children[0])
  })
})
