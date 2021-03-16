const { MyEventManager } = require('../sse/event-manager')
const { EventSourceStream } = require('../sse/event-source-stream')
const { cache: eventManagers } = require('../sse/event-manager-cache')

function eventManagerCall (h, type) {
  const id = h.request.query?.id ?? 99
  console.log(`/${type} hit by: ${id}`)
  const eventManager = eventManagers.get(id)

  let actionSuccess
  switch (type) {
    case 'end':
      // destroy ends the stream, no client reconnections. 'stream.end()' has the client reconnect
      eventManager?.stream?.destroy()
      eventManager?._stopPing()
      actionSuccess = eventManagers.delete(id) ?? false
      break
    case 'trigger':
      actionSuccess = eventManager?.trigger() ?? false
      break
    default:
      console.error(`Unrecognised call: ${type}`)
  }

  return h.response(actionSuccess).code(200)
}

module.exports = [
  {
    method: 'GET',
    path: '/events',
    handler: async (_, h) => {
      const id = h.request.query?.id ?? 99
      console.log(`/events hit by: ${id}`)

      let stream
      let eventManager = eventManagers.get(id)
      if (eventManager) {
        stream = eventManager.stream
      } else {
        stream = new EventSourceStream(id)
        stream.on('close', function () {
          // closing the stream intentionally doesn't do anything on the server
          console.log('event source stream closed')
        })

        eventManager = new MyEventManager(id, stream, 3000)

        // store event manager for use outside of route
        eventManagers.set(id, eventManager)
      }

      return h
        .response(stream)
        .type('text/event-stream')
        .header('Connection', 'keep-alive')
        .header('Cache-Control', 'no-cache')
        .header('X-Accel-Buffering', 'no') // prevent NGINX buffering response
    }
  }, {
    method: 'GET',
    path: '/susie-events',
    handler: (_, h) => {
      const id = h.request.query?.id ?? 99
      console.log(`/susie-events hit by: ${id}`)

      let stream
      let eventManager = eventManagers.get(id)
      if (eventManager) {
        stream = eventManager.stream
      } else {
        stream = new EventSourceStream(id)
        stream.on('close', function () {
          // closing the stream intentionally doesn't do anything on the server
          console.log('event source stream closed')
        })

        eventManager = new MyEventManager(id, stream, 3000)

        // store event manager for use outside of route
        eventManagers.set(id, eventManager)
      }

      // returning the stream like this will send each write on the stream as
      // an event to the client. the event type can be overriden
      // (https://www.npmjs.com/package/susie#with-a-readable-stream) but this
      // means a reference to the event is required and not just the stream
      return h.event(stream)
    }
  }, {
    method: 'GET',
    path: '/sse',
    handler: (_, h) => {
      return h.view('sse')
    }
  }, {
    method: 'GET',
    path: '/susie',
    handler: (_, h) => {
      return h.view('susie')
    }
  }, {
    method: 'GET',
    path: '/end',
    handler: (_, h) => {
      return eventManagerCall(h, 'end')
    }
  }, {
    method: 'GET',
    path: '/trigger',
    handler: (_, h) => {
      return eventManagerCall(h, 'trigger')
    }
  }
]
