const { EventEmitter } = require('events')

class EventManager extends EventEmitter {
  constructor (id) {
    super()
    this.id = id
    console.log(`new EventManager created for ${id}`)
  }

  ping (e) {
    e.userId = this.id
    setInterval(() => this.emit('ping', e), e.period ?? 1000)
  }

  trigger (e) {
    e = e ?? {}
    e.userId = this.id
    this.emit('trigger', e)
    return true
  }
}

module.exports = {
  EventManager
}
