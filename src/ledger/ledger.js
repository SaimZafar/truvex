const fs = require('fs');
const path = require('path');

const ledgerPath = path.join(__dirname, '..', '..', 'ledger.json');

function loadLedger() {
  if (!fs.existsSync(ledgerPath)) {
    return { credentials: {} };
  }
  const raw = fs.readFileSync(ledgerPath, 'utf8');
  return JSON.parse(raw);
}

function saveLedger(ledger) {
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
}

function recordIssuedCredential(payload, blockNumber) {
  const ledger = loadLedger();
  ledger.credentials[payload.credentialId] = {
    studentName: payload.studentName,
    degree: payload.degree,
    cgpa: payload.cgpa,
    issuingInstitution: payload.issuingInstitution,
    credentialId: payload.credentialId,
    status: 'valid',
    issuedInBlock: blockNumber
  };
  saveLedger(ledger);
}

function recordRevokedCredential(payload, blockNumber) {
  const ledger = loadLedger();
  if (ledger.credentials[payload.credentialId]) {
    ledger.credentials[payload.credentialId].status = 'revoked';
    ledger.credentials[payload.credentialId].revokedReason = payload.reason;
    ledger.credentials[payload.credentialId].revokedInBlock = blockNumber;
  }
  saveLedger(ledger);
}

function getCredential(credentialId) {
  const ledger = loadLedger();
  return ledger.credentials[credentialId] || null;
}

module.exports = { recordIssuedCredential, recordRevokedCredential, getCredential, loadLedger };