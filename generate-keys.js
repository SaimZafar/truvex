const fs = require('fs');
const path = require('path');
const ValidatorIdentity = require('./src/identity/node');
const { VALIDATORS } = require('./src/network/validator-registry');

const keysDir = path.join(__dirname, 'keys');

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

for (const validator of VALIDATORS) {
  const identity = new ValidatorIdentity(validator.id);

  const privatePem = identity.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicPem = identity.getPublicKeyPem();

  fs.writeFileSync(path.join(keysDir, `${validator.id}.private.pem`), privatePem);
  fs.writeFileSync(path.join(keysDir, `${validator.id}.public.pem`), publicPem);

  console.log(`Generated keys for ${validator.id}`);
}