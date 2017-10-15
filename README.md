# SYNOPSIS 
[![NPM Package](https://img.shields.io/npm/v/libp2p-gossip-discovery.svg?style=flat-square)](https://www.npmjs.org/package/libp2p-gossip-discovery)
[![Build Status](https://img.shields.io/travis/wanderer/libp2p-gossip-discovery.svg?branch=master&style=flat-square)](https://travis-ci.org/wanderer/libp2p-gossip-discovery)
[![Coverage Status](https://img.shields.io/coveralls/wanderer/libp2p-gossip-discovery.svg?style=flat-square)](https://coveralls.io/r/wanderer/libp2p-gossip-discovery)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)  

This implements peer discovery using gossip. A peer first connects to peers
known to it vai its peer book and asks for more peers. This processes continues
untill `targetNumberOfPeers` is reached.

# INSTALL
`npm install libp2p-gossip-discovery`

# USAGE

```javascript
const GossipDiscovery = require('gossip-discovery')
const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const multiplex = require('libp2p-multiplex')


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
    this.discovery = new GossipDiscovery(this, 10)
  }
}

////

const node = new Node(peerInfo)

node.start(() => {
  node.discovery.start()
})

```

# API
## constructor

[code/peer-gossip/index.js:19-23](https://github.com/wanderer/dot-files/blob/b814be3a626a84f10652c9f2abfdbc0de7cd5f04/code/peer-gossip/index.js#L19-L23 "Source code on GitHub")

**Parameters**

-   `node` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** an instace of [libp2p](https://github.com/libp2p/js-libp2p)
-   `targetNumberOfPeers` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the max number of peers to add to the peer book

## start

[code/peer-gossip/index.js:28-46](https://github.com/wanderer/dot-files/blob/b814be3a626a84f10652c9f2abfdbc0de7cd5f04/code/peer-gossip/index.js#L28-L46 "Source code on GitHub")

starts the gossip process

## stop

[code/peer-gossip/index.js:51-54](https://github.com/wanderer/dot-files/blob/b814be3a626a84f10652c9f2abfdbc0de7cd5f04/code/peer-gossip/index.js#L51-L54 "Source code on GitHub")

stop discovery

# LICENSE
[MPL-2.0](https://tldrlegal.com/license/mozilla-public-license-2.0-(mpl-2))
