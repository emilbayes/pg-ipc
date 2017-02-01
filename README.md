# `pg-ipc`

> IPC over PostgreSQL LISTEN/NOTIFY/UNLISTEN exposed as an EventEmitter

## Usage

```js
var pgIPC = require('pg-ipc')
var client = new require('pg').Client({ ... })

var ipc = pgIPC(client)

ipc.on('error', console.error)

ipc.on('end', function () {
  client.end()
})

ipc.on('someChannel', function (msg) {
  // Ignore messages from this process
  if (msg.processId === client.processID) return
  console.log(msg.payload.currentTime)
})

ipc.notify('someChannel', {currentTime: Date.now()})

// some time later ...

ipc.end()

```

## API

### `pgIPC(client)`

Instantiates a new `EventEmitter` with the appropriate hooks to automatically
`LISTEN`/`NOTIFY`/`UNLISTEN`. Note that `client` must be a `pg.Client` instance
and not a `pg.Pool`, as a single connection is required.

### `ipc.on(channel, listener)`
All the standard `EventEmitter` methods are exposed. When a listener is added to
`channel`, a `LISTEN` command is automatically issued, and `UNLISTEN` when the
number of listeners reach zero. The listener will receive the message as its
first argument. Notable properties being `channel`, `payload`, `processId`. Each
postgres `connection` is assigned a unique `processId`, which can be used to
ignore messages from the same process.
See [`EventEmitter`](https://nodejs.org/api/events.html) for more details.
Reserved channels are:
`['newListener', 'removeListener', 'notify', 'unlisten', 'listen', 'error', 'end']`

### `ipc.notify(channel[, payload])`
Alias: `ipc.send(channel[, payload])`. Send a message to `channel` with optional
`payload`. `payload` is transparently converted to JSON where appropriate.

### `ipc.end()`
Issue `UNLISTEN *` if connected, emit `end` and detach all event listeners.
Does not call `client.end()` so you can continue using the client. However,
any listeners you've issued outside outside of this module will also be detached

### Event: `listen`

Emitted when a `LISTEN` has been successfully issued. Passed `channel`

### Event: `notify`

Emitted after a notification has been successfully sent. Passed `channel` and `payload`

### Event: `unlisten`

Emitted when a `UNLISTEN` has been successfully issued. Passed `channel`

### Event: `end`

Emitted when all `LISTEN`s have been removed, but before all event listeners are removed.

### Event: `error`

Propagates any errors caused by queries on `Client`. Passed the `err` argument from
the query callback.

## Install

```sh
npm install pg-ipc
```

## License

[ISC](LICENSE.md)
