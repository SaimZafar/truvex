const express = require('express');

function startApiServer(apiPort, myNodeId, getNextBlockNumber, isLeaderFn, proposeBlockFn) {
  const app = express();
  app.use(express.json());

  app.post('/issue-credential', (req, res) => {
    if (!isLeaderFn(myNodeId)) {
      return res.status(409).json({ error: `${myNodeId} is not the current leader. Try the current leader's API.` });
    }

    const { studentName, degree, cgpa, credentialId } = req.body;

    if (!studentName || !degree || typeof cgpa !== 'number' || !credentialId) {
      return res.status(400).json({ error: 'Missing or invalid fields. Required: studentName, degree, cgpa (number), credentialId' });
    }

    const payload = {
      action: 'issue',
      studentName,
      degree,
      cgpa,
      issuingInstitution: myNodeId,
      credentialId
    };

    const blockNumber = getNextBlockNumber();
    proposeBlockFn(blockNumber, payload);

    res.status(202).json({ message: 'Proposal broadcast to network, awaiting consensus.', blockNumber, payload });
  });

  app.listen(apiPort, () => {
    console.log(`[${myNodeId}] API server listening on port ${apiPort}`);
  });
}

module.exports = startApiServer;