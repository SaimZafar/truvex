const path = require('path');
const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage } = require('./src/consensus/message');
const WebSocket = require('ws');

const myNodeId = 'HEC';
const myInfo = VALIDATORS.find(v => v.id === myNodeId);

const myIdentity = ValidatorIdentity.loadFromFiles(
  myNodeId,
  path.join(__dirname, 'keys', `${myNodeId}.private.pem`),
  path.join(__dirname, 'keys', `${myNodeId}.public.pem`)
);

function handleIncomingMessage(fromId, rawMessage) {
  console.log(`[MALICIOUS HEC] Ignoring incoming message from ${fromId} (not implementing real consensus logic)`);
}

const { incomingConnections } = startServer(myInfo.port, myNodeId, handleIncomingMessage);

let outgoingConnections = {};

setTimeout(() => {
  const result = connectToPeers(myNodeId, handleIncomingMessage);
  outgoingConnections = result.connections;

  setTimeout(() => {
    const allSockets = { ...outgoingConnections, ...incomingConnections };
    const peerIds = Object.keys(allSockets);
    const half = Math.ceil(peerIds.length / 2);

    const groupA = peerIds.slice(0, half);
    const groupB = peerIds.slice(half);

    const messageA = createSignedMessage('pre-prepare', { block: 1, credential: 'BSIT degree for Ali Raza' }, myIdentity);
    const messageB = createSignedMessage('pre-prepare', { block: 1, credential: 'BSIT degree for A DIFFERENT PERSON' }, myIdentity);

    console.log(`[MALICIOUS HEC] Sending VERSION A to: ${groupA.join(', ')}`);
    for (const peerId of groupA) {
      allSockets[peerId].send(JSON.stringify(messageA));
    }

    console.log(`[MALICIOUS HEC] Sending VERSION B to: ${groupB.join(', ')}`);
    for (const peerId of groupB) {
      allSockets[peerId].send(JSON.stringify(messageB));
    }
  }, 8000);
}, 1000);