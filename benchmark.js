var connectionString = 'postgres://postgres:@localhost:5432/pgipc'
var pg = require('pg')
var ipc = require('.')
var stats = require('statistics')
var speedometer = require('speedometer')

var assert = require('assert')

var client = new pg.Client(connectionString)

client.connect(assert.ifError)

var ee = ipc(client)
ee.once('error', assert.ifError)
ee.once('end', function () {
  client.end()
})

var speed = speedometer(10)

if (process.argv[2] === 'SOURCE') {
  ee.on('notify', function () {
    console.log('Source: ', speed(1))
  })

  for (var i = 0; i < 10000; i++) {
    ee.notify('channel', {sent: Date.now()})
  }

  client.on('drain', function () {
    ee.end()
  })
}

if (process.argv[2] === 'SINK') {
  var deltas = []
  ee.on('channel', function (msg) {
    console.log('Sink: ', speed(1))
    deltas.push(Date.now() - msg.payload.sent)

    if (deltas.length > 9999) {
      ee.end()
    }
  })

  ee.prependOnceListener('end', function () {
    console.log(deltas.reduce(stats))
  })
}