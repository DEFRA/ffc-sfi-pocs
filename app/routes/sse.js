const { PassThrough } = require('stream')

const { EventManager } = require('../sse/event-manager')
const { cache: eventManagers } = require('../sse/event-manager-cache')

class EventSourceStream extends PassThrough {
  constructor (id) {
    super()
    this.id = id
  }
}

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

      eventManager.on('ping', function () {
        const time = new Date().toLocaleTimeString()
        console.log(`ping userId: ${this.id} at ${time}`)
        stream.write('event: ping\n')
        stream.write(`data: ${time}\n\n`)
      })

      eventManager.on('trigger', function () {
        const time = new Date().toLocaleTimeString()
        console.log(`trigger event for ${this.id}`)
        stream.write('event: trigger\n')
        stream.write(`data: triggered at ${time}\n\n`)
      })

      eventManager.on('end', () => {
        console.log('end event sent')
        stream.write('event: end\n')
        stream.write('data: end\n\n')
      })

      // ping every 3 seconds
      eventManager.ping({ period: 3000 })

      // store event manager for use outside of route
      eventManagers.set(id, eventManager)

      const stream = new EventSourceStream(id)
      stream.on('close', function () {
        console.log('event source stream closed')
        eventManagers.get(this.id).removeAllListeners()
      })

      // set retry to happen after 2 seconds
      stream.write(`retry: ${2 * 1000}\n`)
      stream.write('data: initial event sent from server\n\n')
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
    path: '/end',
    handler: (_, h) => {
      const id = h.request.query?.id ?? 99
      console.log(`/end hit by: ${id}`)

      const result = eventManagers.get(id)?.end() ?? false

      return h.response(result).code(200)
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
