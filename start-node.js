const path = require('path');
const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage, verifySignedMessage } = require('./src/consensus/message');
const { isLeader } = require('./src/consensus/state');
const { addPrepare, getPrepareCount, hasReachedQuorum } = require('./src/consensus/prepare-pool');
const WebSocket = require('ws');

const myNodeId = process.argv[2];

const myInfo = VALIDATORS.find(v => v.id === myNodeId);

if (!myInfo) {
  console.log('Unknown node id. Valid options:', VALIDATORS.map(v => v.id).join(', '));
  process.exit(1);
}

const myIdentity = ValidatorIdentity.loadFromFiles(
  myNodeId,
  path.join(__dirname, 'keys', `${myNodeId}.private.pem`),
  path.join(__dirname, 'keys', `${myNodeId}.public.pem`)
);

let broadcastToEveryone;

function handleIncomingMessage(fromId, rawMessage) {
  let signedMsg;
  try {
    signedMsg = JSON.parse(rawMessage);
  } catch (err) {
    console.log(`[${myNodeId}] Could not parse message from ${fromId}`);
    return;
  }

  const senderInfo = VALIDATORS.find(v => v.id === signedMsg.content.senderId);
  if (!senderInfo) {
    console.log(`[${myNodeId}] Unknown sender: ${signedMsg.content.senderId}`);
    return;
  }

  const isValid = verifySignedMessage(signedMsg, senderInfo.publicKeyPem, ValidatorIdentity);

  if (!isValid) {
    console.log(`[${myNodeId}] REJECTED invalid signature from ${signedMsg.content.senderId}`);
    return;
  }

  const { type, payload, senderId } = signedMsg.content;

  if (type === 'pre-prepare') {
    console.log(`[${myNodeId}] Received PRE-PREPARE from ${senderId}: ${JSON.stringify(payload)}`);

    const prepareMsg = createSignedMessage('prepare', { block: payload.block }, myIdentity);
    console.log(`[${myNodeId}] Broadcasting PREPARE for block ${payload.block}`);
    broadcastToEveryone(prepareMsg);

    addPrepare(payload.block, myNodeId);
  }

  if (type === 'prepare') {
    addPrepare(payload.block, senderId);
    const count = getPrepareCount(payload.block);
    console.log(`[${myNodeId}] Prepare count for block ${payload.block}: ${count}`);

    if (hasReachedQuorum(payload.block)) {
      console.log(`[${myNodeId}] QUORUM REACHED for block ${payload.block} prepares!`);
    }
  }
}

const { incomingConnections } = startServer(myInfo.port, myNodeId, handleIncomingMessage);

let outgoingConnections = {};

broadcastToEveryone = function (message) {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);
  const allSockets = { ...outgoingConnections, ...incomingConnections };

  for (const peerId in allSockets) {
    const socket = allSockets[peerId];
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
};

setTimeout(() => {
  const result = connectToPeers(myNodeId, handleIncomingMessage);
  outgoingConnections = result.connections;

  setTimeout(() => {
    if (isLeader(myNodeId)) {
      console.log(`[${myNodeId}] I am the leader. Proposing block 1...`);
      const prePrepareMsg = createSignedMessage('pre-prepare', { block: 1, credential: 'BSIT degree for Ali Raza' }, myIdentity);
      broadcastToEveryone(prePrepareMsg);
    } else {
      console.log(`[${myNodeId}] Waiting for pre-prepare from leader...`);
    }
  }, 8000);
}, 1000);