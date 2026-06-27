const { QUORUM } = require('../network/validator-registry');

const viewChangeMessages = {};

function addViewChangeVote(targetView, senderId) {
  if (!viewChangeMessages[targetView]) {
    viewChangeMessages[targetView] = new Set();
  }
  viewChangeMessages[targetView].add(senderId);
}

function getViewChangeCount(targetView) {
  if (!viewChangeMessages[targetView]) {
    return 0;
  }
  return viewChangeMessages[targetView].size;
}

function hasReachedQuorum(targetView) {
  return getViewChangeCount(targetView) >= QUORUM;
}

module.exports = { addViewChangeVote, getViewChangeCount, hasReachedQuorum };