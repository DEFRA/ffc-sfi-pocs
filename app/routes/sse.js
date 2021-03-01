const { EventManager } = require('../sse/event-manager')
const { cache: eventManagers } = require('../sse/event-manager-cache')

// cache of all event managers, keyed by id
// const eventManagers = new Map()

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
        console.log('existing em found, removing all listeners')
        eventManager.removeAllListeners()
      }

      eventManager = new EventManager(id)

      eventManager.on('ping', (e) => {
        const time = new Date().toLocaleTimeString()
        console.log(`ping userId: ${e.userId} at ${time}`)
        h.event({ data: time, event: 'ping' })
      })

      eventManager.on('trigger', (e) => {
        const time = new Date().toLocaleTimeString()
        console.log(`trigger event for ${e.userId}`)
        h.event({ data: `triggered at ${time}` })
      })

      // ping every 3 seconds
      eventManager.ping({ period: 3000 })

      // store event manager for use outside of route
      eventManagers.set(id, eventManager)

      return h.event({ data: 'hi there', event: 'init' })
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
