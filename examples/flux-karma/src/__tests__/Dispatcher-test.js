import rewire from 'rewire'

var ensureSingleListenerCall = (listener, payload) => {
  expect(listener.calls.count()).toBe(1)
  expect(listener.calls.mostRecent().args[0]).toEqual(payload)
}

describe('Dispatcher', () => {
  let Dispatcher, listener
  const payload = {foo: 'bar'}

  beforeEach(() => {
    Dispatcher = rewire('../Dispatcher')
    listener = jasmine.createSpy('listener')
    Dispatcher.register(listener)
  })

  it('should send actions to subscribers', () => {
    Dispatcher.dispatch(payload)
    ensureSingleListenerCall(listener, payload)
  })

  it('should dispatch server action', () => {
    Dispatcher.handleServerAction(payload)
    ensureSingleListenerCall(listener, {
      source: 'server-action',
      action: {foo: 'bar'}
    })
  })

  it('should dispatch view action', () => {
    Dispatcher.handleViewAction(payload)
    ensureSingleListenerCall(listener, {
      source: 'view-action',
      action: {foo: 'bar'}
    })
  })

  it('should dispatch error action', () => {
    Dispatcher.handleErrorAction(payload)
    ensureSingleListenerCall(listener, {
      source: 'error-action',
      action: {foo: 'bar'}
    })
  })

})