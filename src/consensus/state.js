const state = {
  currentLeader: 'HEC',
  sequenceNumber: 0
};

function isLeader(nodeId) {
  return nodeId === state.currentLeader;
}

module.exports = { state, isLeader };