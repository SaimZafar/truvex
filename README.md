# Truvex

A permissioned blockchain for academic credential verification, built from scratch around a real implementation of **PBFT (Practical Byzantine Fault Tolerance)** consensus.

Seven validators - modeled on HEC and major Pakistani universities - independently agree on which academic credentials are valid before any record is considered final. No single institution's database is the source of truth. If up to 2 of the 7 validators are compromised, lie, or go offline, the network still reaches correct, agreed-upon decisions.

## The problem this solves

Verifying a degree today usually means contacting the issuing university directly, or going through HEC's manual process. Both are slow, and both concentrate trust in a single party. If one university's records system is compromised, a fraudulent degree can be "verified" with no independent check.

Truvex models a network where a small set of trusted institutions jointly sign off on every credential. No single validator can unilaterally fake or hide a record, because the rest of the network would never reach consensus on it.

## Why PBFT, not Proof of Work

This is a **permissioned** network: validators are a known, fixed set of institutions, not anonymous miners. That is exactly the use case PBFT was designed for - fast, deterministic finality among a small group of mutually distrustful but identifiable parties, the same model used by systems like Hyperledger Fabric.

With **N = 7** validators, the network tolerates **f = 2** faulty or malicious validators (N >= 3f + 1), and requires a **quorum of 5** matching votes before any decision is trusted. Any two quorums of 5 out of 7 validators must overlap by at least 3, and since at most 2 can be dishonest, at least one validator in that overlap is guaranteed honest. That guarantee is what makes it mathematically impossible for the network to finalize two conflicting versions of the same block.

## Architecture
truvex/

src/

identity/     - secp256k1 keypairs, signing, verification

network/      - P2P mesh: listen, connect, broadcast, peer identification

consensus/    - PBFT: pre-prepare, prepare, commit, view-change

credentials/  - Schema validation for issue/revoke payloads

ledger/       - Persistent per-validator credential storage

api/          - HTTP endpoints: issue, verify, revoke

keys/                 - Per-validator keypairs (private keys git-ignored)

start-node.js         - Entry point for a single validator process

start-network.js      - Launches all 7 validators with one command

attacker.js           - Adversarial test: signature forgery

malicious-leader.js   - Adversarial test: conflicting proposals from a lying leader

Dockerfile

docker-compose.yml    - Runs all 7 validators as isolated containers

## How consensus works

1. **Pre-prepare** - the current leader proposes a credential action, signs it, and broadcasts it.
2. **Prepare** - every validator that receives and validates the proposal broadcasts a signed prepare vote. Each validator waits for **5 matching votes** before proceeding.
3. **Commit** - once prepare quorum is reached, validators broadcast a signed commit vote. Once **5 matching commits** are reached, the block is finalized and written to the ledger.
4. **View change** - if the current leader does not propose within a timeout, validators vote to elect the next leader in rotation. Once 5 validators agree, the network moves to the new leader automatically.

Every message is signed with the sender's private key and verified against the validator registry before being trusted. A forged or tampered message is discarded immediately.

## Adversarial testing

**attacker.js - signature forgery.** Connects to a live validator and sends a message claiming to be from HEC, signed with a different private key. The network rejects it:

**malicious-leader.js - lying leader.** Uses HEC's real private key to send two different, both validly-signed proposals to different halves of the network. Because no group of 5 validators can agree on either conflicting version, prepare quorum is never reached. The network stalls rather than finalizing a lie.

## What this defends against, and what it does not

**Defends against:**
- Up to 2 of 7 validators being compromised, lying, or going silent
- Forged or impersonated messages from outside the validator set
- A malicious leader sending inconsistent proposals to split the network
- Tampering with message content after signing

**Does not defend against:**
- Collusion of 3 or more validators - if a majority colludes, the 3f+1 guarantee no longer holds. This is a known, accepted limit of PBFT at this validator count.
- Private key compromise - if an attacker steals a validator's actual private key, they can sign as that validator. Key custody is outside this system's scope.
- Real-world identity binding - the system assumes the registered public key for "NUST" genuinely belongs to NUST. Verifying that binding initially is an operational problem, not a cryptographic one.

## Running locally

```bash
npm install
node generate-keys.js
node start-network.js
```

In a separate terminal:

```bash
# Issue a credential
curl -X POST http://localhost:6001/issue-credential \
  -H "Content-Type: application/json" \
  -d '{"studentName": "Ali Raza", "degree": "BSIT", "cgpa": 3.7, "credentialId": "CRED-001"}'

# Verify a credential
curl http://localhost:6001/verify-credential/CRED-001
```

## Running with Docker

```bash
docker compose up --build
```

Starts all 7 validators as isolated containers communicating over Docker's internal network - closer to how 7 independently operated institutional nodes would actually run.

## Deployment status

The 7-node network has been deployed and tested across separate cloud services (Railway), confirming real network-level Byzantine fault tolerance beyond a single-machine simulation. 3 independent services were verified mutually connected and reaching consensus before hitting free-tier infrastructure limits. Full 7-node continuous cloud deployment is pending infrastructure budget; the complete system runs locally via Docker Compose in the meantime.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /issue-credential | Propose a new credential. Only accepted by the current leader. |
| GET | /verify-credential/:credentialId | Read-only lookup of a credential's current status. |
| POST | /revoke-credential | Propose revoking an existing credential. |

## Tech stack

Node.js, native crypto (secp256k1), ws (WebSocket P2P networking), Express, Docker.