const path = require('path');
const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage, verifySignedMessage } = require('./src/consensus/message');

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

  console.log(`[${myNodeId}] Verified message from ${signedMsg.content.senderId}: type=${signedMsg.content.type}, payload=${JSON.stringify(signedMsg.content.payload)}`);
}

startServer(myInfo.port, myNodeId, handleIncomingMessage);

let broadcast;

setTimeout(() => {
  const result = connectToPeers(myNodeId, handleIncomingMessage);
  broadcast = result.broadcast;

  setTimeout(() => {
    console.log(`[${myNodeId}] Broadcasting a signed test message...`);
    const signedMsg = createSignedMessage('pre-prepare', { block: 1, note: `Hello from ${myNodeId}` }, myIdentity);
    broadcast(signedMsg);
  }, 2000);
}, 1000);