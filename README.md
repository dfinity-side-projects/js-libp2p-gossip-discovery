# SYNOPSIS 

[![NPM Package](https://img.shields.io/npm/v/libp2p-gossip-discovery.svg?style=flat-square)](https://www.npmjs.org/package/libp2p-gossip-discovery)
[![Build Status](https://img.shields.io/travis/dfinity/js-libp2p-gossip-discovery.svg?branch=master&style=flat-square)](https://travis-ci.org/dfinity/js-libp2p-gossip-discovery)
[![Coverage Status](https://img.shields.io/coveralls/dfinity/js-libp2p-gossip-discovery.svg?style=flat-square)](https://coveralls.io/r/dfinity/js-libp2p-gossip-discovery)

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

    const discovery = new GossipDiscovery(this, 10)

    const modules = {
      transport: [
        new TCP()
      ],
      connection: {
        muxer: [
          multiplex
        ]
      }, discovery: [discovery]
    }

    super(modules, peerInfo, peerBook, options)
    discovery.attach(this)
  }
}

////

const node = new Node(peerInfo)

node.start(() => {
  console.log('started!')
})

```

### Table of Contents

-   [constructor](#constructor)
-   [attach](#attach)
-   [start](#start)
-   [stop](#stop)

## constructor

[index.js:19-23](https://github.com/wanderer/js-libp2p-peer-gossip/blob/d89bcf8279cb3f62eb9937a4b46c76317ff07d43/index.js#L19-L23 "Source code on GitHub")

**Parameters**

-   `targetNumberOfPeers` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** the max number of peers to add to the peer book

## attach

[index.js:29-31](https://github.com/wanderer/js-libp2p-peer-gossip/blob/d89bcf8279cb3f62eb9937a4b46c76317ff07d43/index.js#L29-L31 "Source code on GitHub")

Attach an instance of libp2p to the discovery instance

**Parameters**

-   `node` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the libp2p instance

## start

[index.js:38-57](https://github.com/wanderer/js-libp2p-peer-gossip/blob/d89bcf8279cb3f62eb9937a4b46c76317ff07d43/index.js#L38-L57 "Source code on GitHub")

starts the gossip process, this is called by libp2p but if you are using
this standalone then this needs to be called

**Parameters**

-   `cb` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** a callback

## stop

[index.js:63-66](https://github.com/wanderer/js-libp2p-peer-gossip/blob/d89bcf8279cb3f62eb9937a4b46c76317ff07d43/index.js#L63-L66 "Source code on GitHub")

stop discovery, this is called by libp2p but if you are using
this standalone then this needs to be called

# LICENSE
[MPL-2.0][LICENSE]

[LICENSE]: https://tldrlegal.com/license/mozilla-public-license-2.0-(mpl-2)
