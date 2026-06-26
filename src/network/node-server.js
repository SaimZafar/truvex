const { WebSocketServer } = require('ws');

function startServer(port, nodeId, onMessage) {
  const server = new WebSocketServer({ port });
  const incomingConnections = {};

  server.on('connection', (socket) => {
    console.log(`[${nodeId}] Someone connected to me`);

    let connectedPeerId = 'unknown';

    socket.on('message', (data) => {
      const text = data.toString();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        parsed = null;
      }

      if (parsed && parsed.type === 'identify') {
        connectedPeerId = parsed.nodeId;
        incomingConnections[connectedPeerId] = socket;
        console.log(`[${nodeId}] Identified incoming connection as ${connectedPeerId}`);
        return;
      }

      onMessage(connectedPeerId, text);
    });
  });

  console.log(`[${nodeId}] Listening on port ${port}`);

  return { server, incomingConnections };
}

module.exports = startServer;