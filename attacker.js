const WebSocket = require('ws');
const ValidatorIdentity = require('./src/identity/node');
const { createSignedMessage } = require('./src/consensus/message');

const targetPort = 5002;

const attackerIdentity = new ValidatorIdentity('Attacker');

const socket = new WebSocket(`ws://localhost:${targetPort}`);

socket.on('open', () => {
  console.log('Attacker connected to target node');

  const forgedMessage = createSignedMessage('pre-prepare', { block: 999, credential: 'FAKE degree for Attacker' }, attackerIdentity);

  forgedMessage.content.senderId = 'HEC';

  console.log('Sending forged message claiming to be HEC...');
  socket.send(JSON.stringify(forgedMessage));

  setTimeout(() => {
    process.exit(0);
  }, 2000);
});