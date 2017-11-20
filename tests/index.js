const tape = require('tape')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const fs = require('fs')
const pify = require('pify')
const multiaddr = require('multiaddr')

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const multiplex = require('libp2p-multiplex')
const pull = require('pull-stream')

const GossipDiscovery = require('../')

class Node extends libp2p {
  constructor (peerInfo, peerBook, options) {
    options = options || {}

    const modules = {
      transport: [
        new TCP()
      ],
      connection: {
        muxer: [
          multiplex
        ]
      }
    }

    super(modules, peerInfo, peerBook, options)
    this.discovery = new GossipDiscovery(this, 3)
  }
}

class Malicious extends libp2p {
  constructor (peerInfo, peerBook, options) {
    options = options || {}

    const modules = {
      transport: [
        new TCP()
      ],
      connection: {
        muxer: [
          multiplex
        ]
      }
    }

    super(modules, peerInfo, peerBook, options)
    this.handle('/discovery/gossip/0.0.0', (proto, conn) => {
      pull(pull.empty(), conn)
    })
  }
}

class Malicous2 extends libp2p {
  constructor (peerInfo, peerBook, options) {
    options = options || {}

    const modules = {
      transport: [
        new TCP()
      ],
      connection: {
        muxer: [
          multiplex
        ]
      }
    }

    super(modules, peerInfo, peerBook, options)
    this.handle('/discovery/gossip/0.0.0', (proto, conn) => {
      pull(pull.once(Buffer.from([99, 1])), conn)
    })
  }
}

tape('tests', async t => {
  t.plan(3)
  let count = 0

  const peerIds = await Promise.all([0, 1, 2].map(id => getPeerId(id)))
  const nodes = peerIds.map((pId, i) => {
    const peerInfo = new PeerInfo(pId)
    const node = new Node(peerInfo)

    node.peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/909${i}`)
    return node
  })

  await Promise.all(nodes.map(n => {
    return new Promise((resolve, reject) => {
      n.start(() => {
        n.discovery.start()
        resolve()
      })
    })
  }))

  const addresses = nodes.map(n => multiaddr(n.peerInfo.multiaddrs.toArray()[0]))
  nodes[2].discovery.on('peer', peer => {
    t.pass()
    isDone()
  })

  nodes[1].discovery.on('peer', peer => {
    t.pass()
    isDone()
  })

  nodes[0].discovery.on('peer', peer => {
    t.pass()
    isDone()
  })

  await pify(nodes[0].dial.bind(nodes[0]))(addresses[1], '/discovery/gossip/0.0.0')
  await pify(nodes[2].dial.bind(nodes[2]))(addresses[0], '/discovery/gossip/0.0.0')

  function isDone () {
    count++
    if (count === 3) {
      const stoping = nodes.map(n => {
        return new Promise((resolve, reject) => {
          n.discovery.stop()
          n.stop(resolve)
        })
      })
      Promise.all(stoping).then(() => {
        t.end()
      })
    }
  }
})

tape('Errors - no data sent', async t => {
  const peerIds = await Promise.all([0, 1].map(id => getPeerId(id)))
  let peerInfo = new PeerInfo(peerIds[0])
  let good = new Node(peerInfo)
  good.peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9090`)

  peerInfo = new PeerInfo(peerIds[1])
  const mal = new Malicious(peerInfo)
  mal.peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9091`)

  await Promise.all([mal, good].map(n => {
    return new Promise((resolve, reject) => {
      n.start(() => {
        if (n.discovery) {
          n.discovery.start()
        }
        resolve()
      })
    })
  }))
  await pify(good.dial.bind(good))(mal.peerInfo.multiaddrs.toArray()[0], '/discovery/gossip/0.0.0')
  good.on('error', () => {
    t.equals(good.peerBook.getAllArray().length, 0)
    good.stop(() => {})
    mal.stop(() => {})
    t.end()
  })
})

tape('Errors - invalid len', async t => {
  const peerIds = await Promise.all([0, 1].map(id => getPeerId(id)))
  let peerInfo = new PeerInfo(peerIds[0])
  let good = new Node(peerInfo)
  good.peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9090`)

  peerInfo = new PeerInfo(peerIds[1])
  const mal = new Malicous2(peerInfo)
  mal.peerInfo.multiaddrs.add(`/ip4/127.0.0.1/tcp/9091`)

  await Promise.all([mal, good].map(n => {
    return new Promise((resolve, reject) => {
      n.start(() => {
        if (n.discovery) {
          n.discovery.start()
        }
        resolve()
      })
    })
  }))
  await pify(good.dial.bind(good))(mal.peerInfo.multiaddrs.toArray()[0], '/discovery/gossip/0.0.0')
  good.on('error', () => {
    t.equals(good.peerBook.getAllArray().length, 0)
    good.stop(() => {})
    mal.stop(() => {})
    t.end()
  })
})

async function getPeerId (index) {
  let id
  try {
    id = pify(PeerId.createFromJSON)(require(`./id${index}`))
  } catch (e) {
    id = await pify(PeerId.create)()
    fs.writeFileSync(`./id${index}.json`, JSON.stringify(id.toJSON()))
  }
  return id
}
