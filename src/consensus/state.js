const { VALIDATORS } = require('../network/validator-registry');

const state = {
  viewNumber: 0
};

function getCurrentLeader() {
  const leaderIndex = state.viewNumber % VALIDATORS.length;
  return VALIDATORS[leaderIndex].id;
}

function isLeader(nodeId) {
  return nodeId === getCurrentLeader();
}

function advanceView() {
  state.viewNumber = state.viewNumber + 1;
}

module.exports = { state, getCurrentLeader, isLeader, advanceView };