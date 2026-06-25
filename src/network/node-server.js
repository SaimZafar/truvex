const { WebSocketServer } = require('ws');

function startServer(port, nodeId) {
  const server = new WebSocketServer({ port });

  server.on('connection', (socket) => {
    console.log(`[${nodeId}] Someone connected to me`);

    socket.on('message', (data) => {
      console.log(`[${nodeId}] Received: ${data.toString()}`);
    });
  });

  console.log(`[${nodeId}] Listening on port ${port}`);

  return server;
}

module.exports = startServer;