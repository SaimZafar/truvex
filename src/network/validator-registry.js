const fs = require('fs');
const path = require('path');

const VALIDATORS = [
  { id: 'HEC', port: 5001 },
  { id: 'NUST', port: 5002 },
  { id: 'Bahria', port: 5003 },
  { id: 'FAST', port: 5004 },
  { id: 'COMSATS', port: 5005 },
  { id: 'LUMS', port: 5006 },
  { id: 'PU', port: 5007 }
];

const keysDir = path.join(__dirname, '..', '..', 'keys');

for (const validator of VALIDATORS) {
  const publicKeyPath = path.join(keysDir, `${validator.id}.public.pem`);
  validator.publicKeyPem = fs.readFileSync(publicKeyPath, 'utf8');
}

const TOTAL_VALIDATORS = VALIDATORS.length;
const FAULTY_TOLERANCE = Math.floor((TOTAL_VALIDATORS - 1) / 3);
const QUORUM = 2 * FAULTY_TOLERANCE + 1;

module.exports = {
  VALIDATORS,
  TOTAL_VALIDATORS,
  FAULTY_TOLERANCE,
  QUORUM
};