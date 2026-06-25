const crypto = require('crypto');

class ValidatorIdentity {
  constructor(nodeId) {
    this.nodeId = nodeId;

    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1'
    });

    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  getPublicKeyPem() {
    return this.publicKey.export({ type: 'spki', format: 'pem' });
  }

  sign(data) {
    let message;
    if (typeof data === 'string') {
       message = data;
    } else {
       message = JSON.stringify(data);
    }
    const signer = crypto.createSign('SHA256');
    signer.update(message);
    signer.end();
    return signer.sign(this.privateKey, 'hex');
  }

  static verify(data, signatureHex, publicKeyPem) {
    let message;
    if (typeof data === 'string') {
       message = data;
    } else {
       message = JSON.stringify(data);
    }
    const verifier = crypto.createVerify('SHA256');
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureHex, 'hex');
  }
}

module.exports = ValidatorIdentity;