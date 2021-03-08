const { EventEmitter } = require('events')

class EventManager extends EventEmitter {
  constructor (id, stream, pingPeriod) {
    super()
    this.id = id
    this.stream = stream
    this.pingPeriod = pingPeriod
    this.eventId = 1 // rudimentary eventId, a counter incremented on events
    console.log(`new EventManager created for ${id}`)
    if (pingPeriod) { this._ping() }
  }

  _ping () {
    setInterval(function () {
      this.eventId++
      this.sendMessage('ping')
    }.bind(this), this.pingPeriod)
  }

  end () {
    this.eventId++
    this.sendMessage('end')
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

class MyEventManager extends EventManager {
  trigger () {
    this.eventId++
    this.sendMessage('trigger')
    return true
  }
}

module.exports = {
  MyEventManager
}
