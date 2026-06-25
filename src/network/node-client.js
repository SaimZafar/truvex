const WebSocket = require('ws');
const { VALIDATORS } = require('./validator-registry');

function connectToPeers(myNodeId, onMessage) {
  const connections = {};

  const peers = VALIDATORS.filter(v => v.id !== myNodeId);

  for (const peer of peers) {
    const socket = new WebSocket(`ws://localhost:${peer.port}`);

    socket.on('open', () => {
      console.log(`[${myNodeId}] Connected to ${peer.id}`);
    });

    socket.on('message', (data) => {
      onMessage(peer.id, data.toString());
    });

    socket.on('error', (err) => {
      console.log(`[${myNodeId}] Could not connect to ${peer.id}: ${err.code}`);
    });

    connections[peer.id] = socket;
  }

  function broadcast(message) {
    let payload;
    if (typeof message === 'string') {
        payload = message;
    } else {
        payload = JSON.stringify(message);
    }

    for (const peerId in connections) {
      const socket = connections[peerId];
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  return { connections, broadcast };
}

module.exports = connectToPeers;