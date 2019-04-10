const tape = require('tape')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const fs = require('fs')
const pify = require('pify')

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WS = require('libp2p-websockets')
const SPDY = require('libp2p-spdy')
const defaultsDeep = require('@nodeutils/defaults-deep')
const pull = require('pull-stream')

const GossipDiscovery = require('../')

class Node extends libp2p {
  constructor (_options) {
    const discovery = new GossipDiscovery(3)

    const defaults = {
      modules: {
        transport: [ TCP ],
        streamMuxer: [ SPDY ],
        peerDiscovery: [ discovery ]
      }
    }

    super(defaultsDeep(_options, defaults))
    discovery.attach(this)
  }
}

class Malicious1 extends libp2p {
  constructor (_options) {
    const defaults = {
      modules: {
        transport: [ TCP ],
        streamMuxer: [ SPDY ]
      }
    }

    super(defaultsDeep(_options, defaults))
    this.handle('/discovery/gossip/0.0.0', (proto, conn) => {
      pull(pull.empty(), conn)
    })
  }
}

class Malicous2 extends libp2p {
  constructor (_options) {
    const defaults = {
      modules: {
        transport: [ TCP ],
        streamMuxer: [ SPDY ]
      }
    }

    super(defaultsDeep(_options, defaults))
    this.handle('/discovery/gossip/0.0.0', (proto, conn) => {
      pull(pull.once(Buffer.from([99, 1])), conn)
    })
  }
}

tape('tests', async t => {
  t.plan(5)
  let count = 0

  const peerIds = await Promise.all([0, 1, 2].map(id => getPeerId(id)))
  const nodes = peerIds.map((pId, i) => {
    const peerInfo = new PeerInfo(pId)
    peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/909${i}`)
    return new Node({peerInfo})
  })

  await Promise.all(nodes.map(n => {
    return new Promise((resolve, reject) => {
      n.start(resolve)
    })
  }))

  const addresses = nodes.map(n => n.peerInfo)
  nodes[2].on('peer:discovery', peer => {
    t.pass()
    isDone()
  })

  nodes[1].on('peer:discovery', peer => {
    t.pass()
    isDone()
  })

  nodes[0].on('peer:discovery', peer => {
    t.pass()
    isDone()
  })

  await pify(nodes[0].dialProtocol.bind(nodes[0]))(addresses[1], '/discovery/gossip/0.0.0')
  await pify(nodes[2].dialProtocol.bind(nodes[2]))(addresses[0], '/discovery/gossip/0.0.0')

  function isDone () {
    count++
    if (count === 5) {
      const stopping = nodes.map(n => {
        return new Promise((resolve, reject) => {
          n.stop(resolve)
        })
      })
      Promise.all(stopping).then(() => {
        t.end()
      })
    }
  }
})

tape('Errors - no data sent', async t => {
  const peerIds = await Promise.all([0, 1].map(id => getPeerId(id)))
  let peerInfo = new PeerInfo(peerIds[0])
  peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9093`)
  let good = new Node({peerInfo})

  peerInfo = new PeerInfo(peerIds[1])
  peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9094`)
  const mal = new Malicious1({peerInfo})

  await Promise.all([mal, good].map(n => {
    return new Promise((resolve, reject) => {
      n.start(resolve)
    })
  }))
  await pify(good.dialProtocol.bind(good))(mal.peerInfo, '/discovery/gossip/0.0.0')
  good.on('error', () => {
    if (good.state._state !== 'STARTED') return
    t.equals(good.peerBook.getAllArray().length, 0)
    const stopping = [mal, good].map(n => {
      return new Promise((resolve, reject) => {
        n.stop(resolve)
      })
    })
    Promise.all(stopping).then(() => {
      t.end()
    })
  })
})

tape('Errors - invalid len', async t => {
  const peerIds = await Promise.all([0, 1].map(id => getPeerId(id)))
  let peerInfo = new PeerInfo(peerIds[0])
  peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9095`)
  let good = new Node({peerInfo})

  peerInfo = new PeerInfo(peerIds[1])
  peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9096`)
  const mal = new Malicous2({peerInfo})

  await Promise.all([mal, good].map(n => {
    return new Promise((resolve, reject) => {
      n.start(resolve)
    })
  }))
  await pify(good.dialProtocol.bind(good))(mal.peerInfo, '/discovery/gossip/0.0.0')
  good.on('error', () => {
    if (good.state._state !== 'STARTED') return
    t.equals(good.peerBook.getAllArray().length, 0)
    const stopping = [mal, good].map(n => {
      return new Promise((resolve, reject) => {
        n.stop(resolve)
      })
    })
    Promise.all(stopping).then(() => {
      t.end()
    })
  })
})

tape.onFinish(() => {
  process.exit(0)
})

async function getPeerId (index) {
  let id
  try {
    id = pify(PeerId.createFromJSON)(require(`${__dirname}/id${index}`))
  } catch (e) {
    id = await pify(PeerId.create)()
    fs.writeFileSync(`${__dirname}/id${index}.json`, JSON.stringify(id.toJSON()))
  }
  return id
}
