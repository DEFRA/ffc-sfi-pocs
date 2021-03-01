const { EventEmitter } = require('events')

class EventManager extends EventEmitter {
  constructor (id) {
    super()
    this.id = id
    console.log(`new EventManager created for ${id}`)
  }

  ping (e) {
    setInterval(() => this.emit('ping'), e.period ?? 1000)
  }

  trigger (e) {
    this.emit('trigger')
    return true
  }

  end () {
    this.emit('end')
    return true
  }
}

module.exports = {
  EventManager
}
