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

setTimeout(() => {
  connectToPeers(myNodeId, handleIncomingMessage);
}, 1000);