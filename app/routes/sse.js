const { PassThrough } = require('stream')

const { EventManager } = require('../sse/event-manager')
const { cache: eventManagers } = require('../sse/event-manager-cache')

class EventSourceStream extends PassThrough {
  constructor (id) {
    super()
    this.id = id
  }
}

function sendMessage (stream, type, eventManager, retry) {
  const time = new Date().toLocaleTimeString()
  console.log(`${type} event for userId: ${eventManager.id} at ${time}`)
  if (type === 'init') { stream.write(`retry: ${retry}\n`) }
  stream.write(`event: ${type}\n`)
  stream.write(`id: ${eventManager.eventId}\n`)
  stream.write(`data: ${time}\n\n`)
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

      // ping every 3 seconds
      eventManager.ping({ period: 3000 })
      eventManager.on('ping', function () {
        sendMessage(stream, 'ping', this)
      })

      eventManager.on('trigger', function () {
        sendMessage(stream, 'trigger', this)
      })

      eventManager.on('end', function () {
        sendMessage(stream, 'end', this)
      })

      // store event manager for use outside of route
      eventManagers.set(id, eventManager)

      const stream = new EventSourceStream(id)
      stream.on('close', function () {
        console.log('event source stream closed')
        eventManagers.get(this.id).removeAllListeners()
      })

      sendMessage(stream, 'init', eventManager, 2000)

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
