const fs = require('fs');
const path = require('path');

let nodeId = 'default';

function setNodeId(id) {
  nodeId = id;
}

function getLedgerPath() {
  return path.join(__dirname, '..', '..', `ledger-${nodeId}.json`);
}

function loadLedger() {
  const ledgerPath = getLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { credentials: {} };
  }
  const raw = fs.readFileSync(ledgerPath, 'utf8');
  if (!raw || raw.trim() === '') {
    return { credentials: {} };
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.log('Warning: ledger was corrupted or empty, starting fresh.');
    return { credentials: {} };
  }
}

function saveLedger(ledger) {
  fs.writeFileSync(getLedgerPath(), JSON.stringify(ledger, null, 2));
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

function getAllCredentials() {
  const ledger = loadLedger();
  return ledger.credentials;
}

module.exports = { setNodeId, recordIssuedCredential, recordRevokedCredential, getCredential, getAllCredentials, loadLedger };