const path = require('path');
const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage, verifySignedMessage } = require('./src/consensus/message');
const { isLeader } = require('./src/consensus/state');
const { addPrepare, getPrepareCount, hasReachedQuorum: prepareQuorumReached } = require('./src/consensus/prepare-pool');
const { addCommit, getCommitCount, hasReachedQuorum: commitQuorumReached, isFinalized, markFinalized } = require('./src/consensus/commit-pool');
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
let myPreparedAlready = {};
let myCommittedAlready = {};

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
    myPreparedAlready[payload.block] = true;
  }

  if (type === 'prepare') {
    addPrepare(payload.block, senderId);
    const count = getPrepareCount(payload.block);
    console.log(`[${myNodeId}] Prepare count for block ${payload.block}: ${count}`);

    if (prepareQuorumReached(payload.block) && myPreparedAlready[payload.block] && !myCommittedAlready[payload.block]) {
      console.log(`[${myNodeId}] PREPARE quorum reached for block ${payload.block}. Broadcasting COMMIT.`);

      const commitMsg = createSignedMessage('commit', { block: payload.block }, myIdentity);
      broadcastToEveryone(commitMsg);

      addCommit(payload.block, myNodeId);
      myCommittedAlready[payload.block] = true;
    }
  }

  if (type === 'commit') {
    addCommit(payload.block, senderId);
    const count = getCommitCount(payload.block);
    console.log(`[${myNodeId}] Commit count for block ${payload.block}: ${count}`);

    if (commitQuorumReached(payload.block) && !isFinalized(payload.block)) {
      markFinalized(payload.block);
      console.log(`[${myNodeId}] *** BLOCK ${payload.block} FINALIZED *** (commit quorum reached)`);
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

      const ownPrepareMsg = createSignedMessage('prepare', { block: 1 }, myIdentity);
      broadcastToEveryone(ownPrepareMsg);

      addPrepare(1, myNodeId);
      myPreparedAlready[1] = true;
      console.log(`[${myNodeId}] Broadcast own prepare vote for block 1`);
    } else {
      console.log(`[${myNodeId}] Waiting for pre-prepare from leader...`);
    }
  }, 15000);
}, 1000);