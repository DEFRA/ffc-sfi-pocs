const { PassThrough } = require('stream')

class EventSourceStream extends PassThrough {
  constructor (id) {
    super()
    this.id = id
  }
}

module.exports = {
  EventSourceStream
}
