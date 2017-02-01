var EventEmitter = require('events').EventEmitter

module.exports = PgIPC

var RESERVED_CHANNELS = ['newListener', 'removeListener', 'notify', 'unlisten', 'listen', 'error', 'end']

function PgIPC (client) {
  var that = new EventEmitter()
  var ending = false

  that.on('newListener', function (channel, fn) {
    if (RESERVED_CHANNELS.indexOf(channel) < 0 && that.listenerCount(channel) === 0) {
      _dispatchListen(channel)
    }
  })

  that.on('removeListener', function (channel, fn) {
    if (RESERVED_CHANNELS.indexOf(channel) < 0 && that.listenerCount(channel) === 0) {
      _dispatchUnlisten(channel)
    }
  })

  client.on('notification', function (msg) {
    try {
      msg.payload = JSON.parse(msg.payload)
    } catch (ex) {}
    finally {
      that.emit(msg.channel, msg)
    }
  })

  that.send = that.notify = function (channel, payload) {
    var encodedPayload
    if (payload != null) encodedPayload = typeof payload !== 'string' ? JSON.stringify(payload) : payload

    var statement = `NOTIFY ${client.escapeIdentifier(channel)}` + (encodedPayload != null ? `, ${client.escapeLiteral(encodedPayload)}` : '')

    client.query(statement, function (err) {
      if (err) return that.emit('error', err)
      that.emit('notify', channel, payload)
    })
  }

  that.end = function () {
    if (ending) return
    ending = true
    if (client.connection.stream.readyState === 'open') return client.query(`UNLISTEN *`, _end)
    else return _end()

    function _end (err) {
      if (err) {
        ending = false
        return that.emit('error', err)
      }
      that.emit('end')
      that.removeAllListeners()
    }
  }

  return that

  function _dispatchListen (channel) {
    client.query(`LISTEN ${client.escapeIdentifier(channel)}`, function (err) {
      if (err) return that.emit('error', err)
      that.emit('listen', channel)
    })
  }

  function _dispatchUnlisten (channel) {
    client.query(`UNLISTEN ${client.escapeIdentifier(channel)}`, function (err) {
      if (err) return that.emit('error', err)
      this.emit('unlisten', channel)
    })
  }
}