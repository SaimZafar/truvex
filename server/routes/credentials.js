const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

const BLOCKCHAIN_BASE = process.env.BLOCKCHAIN_API_BASE;

async function fetchBlockchain(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BLOCKCHAIN_BASE}1${path}`);
  return res;
}

router.post('/issue', authMiddleware, requireRole('hec', 'university'), async (req, res) => {
  try {
    const { studentName, degree, cgpa, credentialId } = req.body;

    let issuingInstitution = 'HEC';
    if (req.user.role === 'university') {
      if (!req.user.institution) {
        return res.status(400).json({ error: 'No institution associated with this account.' });
      }
      issuingInstitution = req.user.institution;
    }

    const response = await fetch(`${BLOCKCHAIN_BASE}1/issue-credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, degree, cgpa, credentialId, issuingInstitution })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(202).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/:credentialId', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${BLOCKCHAIN_BASE}1/verify-credential/${req.params.credentialId}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data.credential);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/revoke', authMiddleware, requireRole('hec'), async (req, res) => {
  try {
    const { credentialId, reason } = req.body;

    const response = await fetch(`${BLOCKCHAIN_BASE}1/revoke-credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId, reason })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(202).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${BLOCKCHAIN_BASE}1/credentials`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data.credentials || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;