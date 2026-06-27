const { QUORUM } = require('../network/validator-registry');

const prepareMessages = {};

function addPrepare(blockNumber, senderId) {
  if (!prepareMessages[blockNumber]) {
    prepareMessages[blockNumber] = new Set();
  }
  prepareMessages[blockNumber].add(senderId);
}

function getPrepareCount(blockNumber) {
  if (!prepareMessages[blockNumber]) {
    return 0;
  }
  return prepareMessages[blockNumber].size;
}

function hasReachedQuorum(blockNumber) {
  return getPrepareCount(blockNumber) >= QUORUM;
}

module.exports = { addPrepare, getPrepareCount, hasReachedQuorum };