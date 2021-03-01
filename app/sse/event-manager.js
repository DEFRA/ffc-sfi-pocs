const { EventEmitter } = require('events')

class EventManager extends EventEmitter {
  constructor (id) {
    super()
    this.id = id
    this.eventId = 1 // rudimentary eventId, a counter incremented on events
    console.log(`new EventManager created for ${id}`)
  }

  ping (e) {
    setInterval(() => {
      this.eventId++
      this.emit('ping')
    }, e.period ?? 1000)
  }

  trigger () {
    this.eventId++
    this.emit('trigger')
    return true
  }

  end () {
    this.eventId++
    this.emit('end')
    return true
  }
}

module.exports = {
  EventManager
}
