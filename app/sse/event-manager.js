const { EventEmitter } = require('events')

class EventManager extends EventEmitter {
  constructor (id, stream, pingPeriod = 1000) {
    super()
    this.id = id
    this.stream = stream
    this.pingPeriod = pingPeriod
    this.eventId = 1 // rudimentary eventId, a counter incremented on events
    console.log(`new EventManager created for ${id}`)
    this.ping()
  }

  ping () {
    setInterval(function () {
      this.eventId++
      this.sendMessage('ping')
    }.bind(this), this.pingPeriod)
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

  sendMessage (type, retry) {
    const time = new Date().toLocaleTimeString()
    console.log(`event log | time: ${time} | type: ${type.substring(0, 4)} | userId: ${this.id} | count: ${this.eventId}`)
    if (type === 'init') { this.stream.write(`retry: ${retry}\n`) }
    this.stream.write(`event: ${type}\n`)
    this.stream.write(`id: ${this.eventId}\n`)
    this.stream.write(`data: ${time}\n\n`)
  }
}

module.exports = {
  EventManager
}
