const path = require('path');
const startServer = require('./src/network/node-server');
const connectToPeers = require('./src/network/node-client');
const { VALIDATORS } = require('./src/network/validator-registry');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage, verifySignedMessage } = require('./src/consensus/message');
const { state, getCurrentLeader, isLeader, advanceView } = require('./src/consensus/state');
const { addPrepare, getPrepareCount, hasReachedQuorum: prepareQuorumReached } = require('./src/consensus/prepare-pool');
const { addCommit, getCommitCount, hasReachedQuorum: commitQuorumReached, isFinalized, markFinalized } = require('./src/consensus/commit-pool');
const { addViewChangeVote, getViewChangeCount, hasReachedQuorum: viewChangeQuorumReached } = require('./src/consensus/view-change-pool');
const { isValidCredentialPayload } = require('./src/credentials/schema');
const { setNodeId, recordIssuedCredential, recordRevokedCredential, getCredential, getAllCredentials } = require('./src/ledger/ledger');
const startApiServer = require('./src/api/server');
const WebSocket = require('ws');

const API_PORT_OFFSET = 1000;
let highestBlockNumber = 0;

function getNextBlockNumber() {
  highestBlockNumber = highestBlockNumber + 1;
  return highestBlockNumber;
}

const myNodeId = process.argv[2];
setNodeId(myNodeId);

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
let myViewChangeVoteSent = {};
let leaderTimeoutHandle = null;
let advancedToView = {};
let prePrepareReceivedForView = {};
let blockPayloads = {};

const LEADER_TIMEOUT_MS = 10000;

function startLeaderTimeout() {
  if (prePrepareReceivedForView[state.viewNumber]) {
    console.log(`[${myNodeId}] Pre-prepare already received for view ${state.viewNumber}, skipping timeout.`);
    return;
  }
  clearLeaderTimeout();
  leaderTimeoutHandle = setTimeout(() => {
    if (prePrepareReceivedForView[state.viewNumber]) {
      return;
    }
    const targetView = state.viewNumber + 1;
    if (!myViewChangeVoteSent[targetView]) {
      console.log(`[${myNodeId}] Leader timeout! Broadcasting VIEW-CHANGE vote for view ${targetView}`);
      const viewChangeMsg = createSignedMessage('view-change', { targetView }, myIdentity);
      broadcastToEveryone(viewChangeMsg);
      addViewChangeVote(targetView, myNodeId);
      myViewChangeVoteSent[targetView] = true;
      checkViewChangeQuorum(targetView);
    }
  }, LEADER_TIMEOUT_MS);
}

function clearLeaderTimeout() {
  if (leaderTimeoutHandle) {
    clearTimeout(leaderTimeoutHandle);
    leaderTimeoutHandle = null;
  }
}

function proposeBlock(blockNumber, credentialPayload) {
  if (blockNumber > highestBlockNumber) {
    highestBlockNumber = blockNumber;
  }

  console.log(`[${myNodeId}] I am the leader. Proposing block ${blockNumber}: ${credentialPayload.action} ${credentialPayload.credentialId}`);
  const prePrepareMsg = createSignedMessage('pre-prepare', { block: blockNumber, ...credentialPayload }, myIdentity);
  broadcastToEveryone(prePrepareMsg);

  blockPayloads[blockNumber] = credentialPayload;

  const ownPrepareMsg = createSignedMessage('prepare', { block: blockNumber }, myIdentity);
  broadcastToEveryone(ownPrepareMsg);

  addPrepare(blockNumber, myNodeId);
  myPreparedAlready[blockNumber] = true;
  prePrepareReceivedForView[state.viewNumber] = true;
  console.log(`[${myNodeId}] Broadcast own prepare vote for block ${blockNumber}`);
}

function checkViewChangeQuorum(targetView) {
  if (viewChangeQuorumReached(targetView) && !advancedToView[targetView]) {
    advancedToView[targetView] = true;
    while (state.viewNumber < targetView) {
      advanceView();
    }
    console.log(`[${myNodeId}] VIEW CHANGE QUORUM REACHED. Now in view ${state.viewNumber}, new leader is ${getCurrentLeader()}`);

    if (isLeader(myNodeId)) {
      console.log(`[${myNodeId}] I am the new leader for view ${state.viewNumber}.`);
    } else {
      startLeaderTimeout();
    }
  }
}

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
    if (!isValidCredentialPayload(payload)) {
      console.log(`[${myNodeId}] REJECTED invalid credential payload in pre-prepare for block ${payload.block}`);
      return;
    }

    if (payload.block > highestBlockNumber) {
      highestBlockNumber = payload.block;
    }

    prePrepareReceivedForView[state.viewNumber] = true;
    clearLeaderTimeout();
    console.log(`[${myNodeId}] Received PRE-PREPARE from ${senderId}: ${payload.action} ${payload.credentialId}`);

    blockPayloads[payload.block] = payload;

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

      const finalizedPayload = blockPayloads[payload.block];
      if (finalizedPayload.action === 'issue') {
        recordIssuedCredential(finalizedPayload, payload.block);
        console.log(`[${myNodeId}] *** BLOCK ${payload.block} FINALIZED *** ISSUED ${finalizedPayload.credentialId} for ${finalizedPayload.studentName}`);
      } else if (finalizedPayload.action === 'revoke') {
        recordRevokedCredential(finalizedPayload, payload.block);
        console.log(`[${myNodeId}] *** BLOCK ${payload.block} FINALIZED *** REVOKED ${finalizedPayload.credentialId}: ${finalizedPayload.reason}`);
      }
    }
  }

  if (type === 'view-change') {
    addViewChangeVote(payload.targetView, senderId);
    const count = getViewChangeCount(payload.targetView);
    console.log(`[${myNodeId}] View-change vote count for view ${payload.targetView}: ${count}`);
    checkViewChangeQuorum(payload.targetView);
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

startApiServer(myInfo.port + API_PORT_OFFSET, myNodeId, getNextBlockNumber, isLeader, proposeBlock, getCredential, getAllCredentials);

setTimeout(() => {
  const result = connectToPeers(myNodeId, handleIncomingMessage);
  outgoingConnections = result.connections;

  setTimeout(() => {
    if (isLeader(myNodeId)) {
      console.log(`[${myNodeId}] I am the leader, waiting for an issue-credential request via the API.`);
    } else {
      console.log(`[${myNodeId}] Connected. Leader is ${getCurrentLeader()}. Waiting for network activity before watching for timeouts.`);
    }
  }, 15000);
}, 1000);