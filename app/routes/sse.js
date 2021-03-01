const { PassThrough } = require('stream')

const { EventManager } = require('../sse/event-manager')
const { cache: eventManagers } = require('../sse/event-manager-cache')

// class ResponseStream extends PassThrough {
//   setCompressor (compressor) {
//     this._compressor = compressor
//   }
// }

module.exports = [
  {
    method: 'GET',
    path: '/events',
    handler: async (_, h) => {
      const id = h.request.query?.id ?? 99
      console.log(`/events hit by: ${id}`)

      // removeAllListeners from existing instance else events stack
      // alternatively returning the response at this point sends the events to
      // the old (disconnected client)
      let eventManager = eventManagers.get(id)
      if (eventManager) {
        console.log('existing event manager found, removing all listeners')
        eventManager.removeAllListeners()
      }

      eventManager = new EventManager(id)

      eventManager.on('ping', (e) => {
        const time = new Date().toLocaleTimeString()
        console.log(`ping userId: ${e.userId} at ${time}`)
        stream.write('event: ping\n')
        stream.write(`data: ${time}\n\n`)
        // stream._compressor.flush()
      })

      eventManager.on('trigger', (e) => {
        const time = new Date().toLocaleTimeString()
        console.log(`trigger event for ${e.userId}`)
        stream.write('event: trigger\n')
        stream.write(`data: triggered at ${time}\n\n`)
        // stream._compressor.flush()
      })

      // ping every 3 seconds
      eventManager.ping({ period: 3000 })

      // store event manager for use outside of route
      eventManagers.set(id, eventManager)

      const stream = new PassThrough()
      stream.write('data: initial event sent from server\n\n')
      // NOTE: setTimeout is required as the setCompressor function isn't
      //       called until the response is being processed by Hapi and there
      //       is no compressor set on the stream for a flush to be called on
      // setTimeout(() => stream._compressor.flush())
      return h
        .response(stream)
        .type('text/event-stream')
        .header('Connection', 'keep-alive')
        .header('Cache-Control', 'no-cache')
    }
  }, {
    method: 'GET',
    path: '/sse',
    handler: (_, h) => {
      return h.view('sse')
    }
  }, {
    method: 'GET',
    path: '/trigger',
    handler: (_, h) => {
      const id = h.request.query?.id ?? 99
      console.log(`/trigger hit by: ${id}`)

      const result = eventManagers.get(id)?.trigger() ?? false

      return h.response(result).code(200)
    }
  }
]
