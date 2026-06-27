const fs = require('fs');
const path = require('path');

const VALIDATORS = [
  { id: 'HEC',     port: 5001, host: process.env.HEC_HOST     || 'localhost' },
  { id: 'NUST',    port: 5002, host: process.env.NUST_HOST    || 'localhost' },
  { id: 'Bahria',  port: 5003, host: process.env.BAHRIA_HOST  || 'localhost' },
  { id: 'FAST',    port: 5004, host: process.env.FAST_HOST    || 'localhost' },
  { id: 'COMSATS', port: 5005, host: process.env.COMSATS_HOST || 'localhost' },
  { id: 'LUMS',    port: 5006, host: process.env.LUMS_HOST    || 'localhost' },
  { id: 'PU',      port: 5007, host: process.env.PU_HOST      || 'localhost' }
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