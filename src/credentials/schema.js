function isValidIssuePayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.action !== 'issue') return false;
  if (typeof payload.studentName !== 'string' || payload.studentName.trim() === '') return false;
  if (typeof payload.degree !== 'string' || payload.degree.trim() === '') return false;
  if (typeof payload.cgpa !== 'number' || payload.cgpa < 0 || payload.cgpa > 4.0) return false;
  if (typeof payload.issuingInstitution !== 'string' || payload.issuingInstitution.trim() === '') return false;
  if (typeof payload.credentialId !== 'string' || payload.credentialId.trim() === '') return false;
  return true;
}

function isValidRevokePayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.action !== 'revoke') return false;
  if (typeof payload.credentialId !== 'string' || payload.credentialId.trim() === '') return false;
  if (typeof payload.reason !== 'string' || payload.reason.trim() === '') return false;
  return true;
}

function isValidCredentialPayload(payload) {
  if (!payload || typeof payload.action !== 'string') return false;
  if (payload.action === 'issue') return isValidIssuePayload(payload);
  if (payload.action === 'revoke') return isValidRevokePayload(payload);
  return false;
}

module.exports = { isValidIssuePayload, isValidRevokePayload, isValidCredentialPayload };