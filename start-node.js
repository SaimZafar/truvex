const path = require('path');
const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage, verifySignedMessage } = require('./src/consensus/message');
const { isLeader } = require('./src/consensus/state');
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

  if (signedMsg.content.type === 'pre-prepare') {
    console.log(`[${myNodeId}] Received PRE-PREPARE from ${signedMsg.content.senderId}: ${JSON.stringify(signedMsg.content.payload)}`);
  } else {
    console.log(`[${myNodeId}] Verified message from ${signedMsg.content.senderId}: type=${signedMsg.content.type}`);
  }
}

const { incomingConnections } = startServer(myInfo.port, myNodeId, handleIncomingMessage);

let outgoingConnections = {};

function broadcastToEveryone(message) {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);

  const allSockets = { ...outgoingConnections, ...incomingConnections };

  for (const peerId in allSockets) {
    const socket = allSockets[peerId];
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

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