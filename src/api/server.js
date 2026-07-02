const express = require('express');
const { getCurrentLeader } = require('../consensus/state');
const { VALIDATORS } = require('../network/validator-registry');

function startApiServer(apiPort, myNodeId, getNextBlockNumber, isLeaderFn, proposeBlockFn, getCredentialFn, getAllCredentialsFn) {
  const app = express();
  app.use(express.json());

  app.post('/issue-credential', (req, res) => {
    if (!isLeaderFn(myNodeId)) {
      return res.status(409).json({ error: `${myNodeId} is not the current leader. Try the current leader's API.` });
    }

    const { studentName, degree, cgpa, credentialId, issuingInstitution } = req.body;
if (!studentName || !degree || typeof cgpa !== 'number' || !credentialId) {
  return res.status(400).json({ error: 'Missing or invalid fields. Required: studentName, degree, cgpa (number), credentialId' });
}
const existing = getCredentialFn(credentialId);
if (existing) {
  return res.status(409).json({ error: `Credential ${credentialId} already exists.` });
}
const payload = {
  action: 'issue',
  studentName,
  degree,
  cgpa,
  issuingInstitution: issuingInstitution || myNodeId,
  credentialId
};

    const blockNumber = getNextBlockNumber();
    proposeBlockFn(blockNumber, payload);

    res.status(202).json({ message: 'Proposal broadcast to network, awaiting consensus.', blockNumber, payload });
  });
  app.get('/verify-credential/:credentialId', (req, res) => {
    const credential = getCredentialFn(req.params.credentialId);
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found.' });
    }
    res.json({ credential });
  });
  app.get('/credentials', (req, res) => {
    res.json({ credentials: getAllCredentialsFn() });
  });
  app.get('/leader', (req, res) => {
    const leaderId = getCurrentLeader();
    const leaderIndex = VALIDATORS.findIndex(v => v.id === leaderId) + 1;
    res.json({ leaderId, leaderIndex });
  });
  app.post('/revoke-credential', (req, res) => {
    if (!isLeaderFn(myNodeId)) {
      return res.status(409).json({ error: `${myNodeId} is not the current leader. Try the current leader's API.` });
    }
    const { credentialId, reason } = req.body;
    if (!credentialId || !reason) {
      return res.status(400).json({ error: 'Missing credentialId or reason.' });
    }
    const existing = getCredentialFn(credentialId);
    if (!existing) {
      return res.status(404).json({ error: `Credential ${credentialId} not found.` });
    }
    if (existing.status === 'revoked') {
      return res.status(409).json({ error: `Credential ${credentialId} is already revoked.` });
    }
    const payload = { action: 'revoke', credentialId, reason };
    const blockNumber = getNextBlockNumber();
    proposeBlockFn(blockNumber, payload);
    res.status(202).json({ message: 'Revocation proposed, awaiting consensus.', blockNumber, payload });
  });
  app.listen(apiPort, () => {
    console.log(`[${myNodeId}] API server listening on port ${apiPort}`);
  });
}

module.exports = startApiServer;