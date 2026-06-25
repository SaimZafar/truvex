const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');

const myNodeId = process.argv[2];

const myInfo = VALIDATORS.find(v => v.id === myNodeId);

if (!myInfo) {
  console.log('Unknown node id. Valid options:', VALIDATORS.map(v => v.id).join(', '));
  process.exit(1);
}

startServer(myInfo.port, myNodeId);

function handleIncomingMessage(fromId, message) {
  console.log(`[${myNodeId}] Message from ${fromId}: ${message}`);
}

let broadcast;

setTimeout(() => {
  const result = connectToPeers(myNodeId, handleIncomingMessage);
  broadcast = result.broadcast;

  setTimeout(() => {
    console.log(`[${myNodeId}] Broadcasting a test message to all peers...`);
    broadcast(`Hello everyone, this is ${myNodeId}`);
  }, 2000);
}, 1000);