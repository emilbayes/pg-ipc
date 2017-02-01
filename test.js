var test = require('tape')

var connectionString = 'postgres://postgres:@localhost:5432/pgipc'
var pg = require('pg')
var ipc = require('.')
var afterAll = require('after-all')

test('example', function (assert) {
  var client = new pg.Client(connectionString)

  client.connect(assert.error)

  var ee = ipc(client)
  ee.once('error', assert.error)
  ee.once('end', function () {
    client.end()
    assert.end()
  })

  ee.once('message', function (msg) {
    assert.deepEquals(msg.payload, {hello: 'world', foo: 1, bar: [1, null, "qux"], set: true}, 'should have same ')
    ee.end()
  })

  ee.notify('message', {hello: 'world', foo: 1, bar: [1, null, "qux"], set: true})
})

test('channel name with quotes', function (assert) {
  var client = new pg.Client(connectionString)

  client.connect(assert.error)

  var ee = ipc(client)
  ee.once('error', assert.error)
  ee.once('end', function () {
    client.end()
    assert.end()
  })

  ee.once('"channel"', function (msg) {
    assert.ok(msg)
    ee.end()
  })

  ee.notify('"channel"')
})

test('payload with quotes', function (assert) {
  var client = new pg.Client(connectionString)

  client.connect(assert.error)

  var ee = ipc(client)
  ee.once('error', assert.error)
  ee.once('end', function () {
    client.end()
    assert.end()
  })

  ee.once('channel', function (msg) {
    assert.ok(msg.payload === "'message'")
    ee.end()
  })

  ee.notify('channel', "'message'")
})

test('multiple listeners on channel', function (assert) {
  var client = new pg.Client(connectionString)

  client.connect(assert.error)

  var ee = ipc(client)
  var after = afterAll(ee.end)

  ee.once('error', assert.error)
  ee.once('end', function () {
    client.end()
    assert.end()
  })

  var listenOnce = false
  ee.on('listen', function () {
    assert.ok(listenOnce = !listenOnce, 'should only fire once')
  })

  ee.once('channel', after(function (msg) {
    assert.ok(msg)
  }))

  ee.once('channel', after(function (msg) {
    assert.ok(msg)
  }))

  ee.notify('channel')
})

test('once then notify should not notify listeners again', function (assert) {
  var client = new pg.Client(connectionString)

  client.connect(assert.error)

  var ee = ipc(client)
  ee.once('error', assert.error)
  ee.once('end', function () {
    client.end()
    assert.end()
  })

  ee.once('channel', function (msg) {
    assert.ok(msg)
  })

  ee.notify('channel')
  ee.send('channel')

  var cnt = 0
  ee.on('notify', function () {
    assert.ok(++cnt <= 2)
    if (cnt === 2) ee.end()
  })
})

test('should end even when client is not connected', function (assert) {
  var client = new pg.Client(connectionString)

  var ee = ipc(client)
  ee.once('error', assert.error)
  ee.once('end', function () {
    ee.notify('channel')
    client.end()
    assert.end()
  })

  ee.once('channel', assert.error)

  ee.end()
})