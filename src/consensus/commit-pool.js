const { QUORUM } = require('../network/validator-registry');

const commitMessages = {};
const finalizedBlocks = new Set();

function addCommit(blockNumber, senderId) {
  if (!commitMessages[blockNumber]) {
    commitMessages[blockNumber] = new Set();
  }
  commitMessages[blockNumber].add(senderId);
}

function getCommitCount(blockNumber) {
  if (!commitMessages[blockNumber]) {
    return 0;
  }
  return commitMessages[blockNumber].size;
}

function hasReachedQuorum(blockNumber) {
  return getCommitCount(blockNumber) >= QUORUM;
}

function isFinalized(blockNumber) {
  return finalizedBlocks.has(blockNumber);
}

function markFinalized(blockNumber) {
  finalizedBlocks.add(blockNumber);
}

module.exports = { addCommit, getCommitCount, hasReachedQuorum, isFinalized, markFinalized };