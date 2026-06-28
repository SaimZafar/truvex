const crypto = require('crypto');
const fs = require('fs');

class ValidatorIdentity {
  constructor(nodeId, existingKeys) {
    this.nodeId = nodeId;

    if (existingKeys) {
      this.publicKey = crypto.createPublicKey(existingKeys.publicPem);
      this.privateKey = crypto.createPrivateKey(existingKeys.privatePem);
    } else {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1'
      });
      this.publicKey = publicKey;
      this.privateKey = privateKey;
    }
  }

  static loadFromFiles(nodeId, privateKeyPath, publicKeyPath) {
  const envVarName = `${nodeId.toUpperCase()}_PRIVATE_KEY`;
  const privateKeyFromEnv = process.env[envVarName];

  const privatePem = privateKeyFromEnv
    ? privateKeyFromEnv.replace(/\\n/g, '\n')
    : fs.readFileSync(privateKeyPath, 'utf8');

  const publicPem = fs.readFileSync(publicKeyPath, 'utf8');
  return new ValidatorIdentity(nodeId, { privatePem, publicPem });
  }

  getPublicKeyPem() {
    return this.publicKey.export({ type: 'spki', format: 'pem' });
  }

  sign(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const signer = crypto.createSign('SHA256');
    signer.update(message);
    signer.end();
    return signer.sign(this.privateKey, 'hex');
  }

  static verify(data, signatureHex, publicKeyPem) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureHex, 'hex');
  }
}

module.exports = ValidatorIdentity;