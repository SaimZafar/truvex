function createSignedMessage(type, payload, senderIdentity) {
  const content = {
    type,
    payload,
    senderId: senderIdentity.nodeId
  };

  const signature = senderIdentity.sign(content);

  return {
    content,
    signature
  };
}

function verifySignedMessage(signedMessage, senderPublicKeyPem, ValidatorIdentity) {
  return ValidatorIdentity.verify(signedMessage.content, signedMessage.signature, senderPublicKeyPem);
}

module.exports = { createSignedMessage, verifySignedMessage };