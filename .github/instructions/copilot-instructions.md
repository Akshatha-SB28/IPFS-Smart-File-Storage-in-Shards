---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

# copilot-instructions.md
## Project purpose (one-liner)
Decentralized cloud storage: store encrypted file blobs on IPFS (Pinata), keep minimal metadata on-chain, and use a self-hosted Postgres + JWT backend for auth, metadata, and access tracking. Add two novel features: **Adaptive Multi-Node Pinning** and **Client-Side Threshold Encryption**.

---

## Tech stack (exact)
- Frontend: React (Vite)
- Backend: Node.js (>=18) + Express
- Database & Auth: PostgreSQL (self-hosted via Docker) + bcrypt + JWT
- Optional cache: Redis (Docker)
- IPFS: Pinata REST API (pinFileToIPFS) and optional local IPFS node (go-ipfs)
- Smart contract: Solidity 0.8.x (Hardhat or Truffle)
- Libraries:
  - `pg` / `knex` (Postgres client)
  - `jsonwebtoken`, `bcrypt`
  - `axios`
  - `ipfs-http-client` (optional)
  - `secrets.js-grempe` (Shamir)
  - `crypto` / Web Crypto API (AES-GCM)
  - `node-cron` (scheduler)
  - `ethers` or `web3.js` (contract calls)

---

## High-level components & responsibilities
1. **Frontend** (React)
   - Login / register (email + password).
   - Upload UI: choose encryption (threshold) or plain.
   - Show file list, CID, pin status, replication graph, request decryption.
   - Perform client-side AES-GCM encryption and Shamir splitting when threshold encryption enabled.

2. **Backend** (Express)
   - Auth routes: register/login (bcrypt + JWT).
   - Upload route: verify JWT, accept multipart file, call Pinata, create `files` record, call contract, create initial `replicas` record.
   - Access endpoints: list files, file details, pin-status.
   - Decryption orchestration: request shards, validate authorization, return shard refs (or orchestrate direct-to-client shard transfers).
   - Pinning monitor service: evaluates access logs and triggers replication.

3. **Database** (Postgres)
   - Tables: `users`, `files`, `replicas`, `access_logs`, `key_shards`.
   - Use migrations (SQL) and Docker Compose for local dev.

4. **Smart Contract**
   - Minimal on-chain storage: register `cid`, uploader address and metadataHash; emit events for off-chain watchers.
   - Avoid storing secrets on-chain — only references.

5. **Novel features**
   - **Adaptive Multi-Node Pinning**
     - Track accesses in `access_logs`.
     - Scheduled policy engine (node-cron) checks hot files and instructs extra pinning (Pinata + other providers or self-hosted nodes).
     - Store replicas in `replicas` table with provider metadata and health.
   - **Client-Side Threshold Encryption**
     - Client generates AES-GCM key, encrypts file locally.
     - Split key into `n` shards with threshold `t` using Shamir secret storage.
     - Store shard references and holder info in `key_shards` table (encrypted references only).
     - Decryption requires retrieving `t` shards from holders and combining client-side.

---

## Repo layout (recommended)
/ (repo root)
├─ docker-compose.yml
├─ frontend/ # React (Vite)
├─ backend/ # Node + Express
│ ├─ src/
│ │ ├─ controllers/
│ │ ├─ routes/
│ │ ├─ services/
│ │ │ ├─ db/
│ │ │ ├─ pinataService.js
│ │ │ ├─ encryptionService.js
│ │ │ ├─ authService.js
│ │ │ └─ pinningMonitor.js
│ └─ package.json
├─ contracts/
├─ infra/
└─ README.md


---

## Environment variables (exact)
Place in `backend/.env` (example names)
PORT=4000

Postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=storage_db
POSTGRES_USER=sa_user
POSTGRES_PASSWORD=sa_password
DATABASE_URL=postgresql://sa_user:sa_password@postgres:5432/storage_db

JWT / Auth
JWT_SECRET=change_me_securely
JWT_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

Pinata
PINATA_API_KEY=...
PINATA_API_SECRET=...
PINATA_JWT=...

Ethereum
ETH_PROVIDER_URL=https://sepolia.infura.io/v3/<INFURA_KEY>
CONTRACT_ADDRESS=0x...
CONTRACT_PRIVATE_KEY=0x...

Optional Redis
REDIS_URL=redis://redis:6379


---

## Minimal DB schema (for migrations)
- `users` — id, email(unique), password_hash, display_name, created_at
- `files` — id, uploader_id (FK), cid, filename, size, metadata_hash, pinned_at, created_at
- `replicas` — id, file_id (FK), provider, provider_metadata (jsonb), pinned_at, status, last_checked
- `access_logs` — id, file_id (FK), accessed_by (FK), access_time, action
- `key_shards` — id, file_id (FK), shard_index, shard_ref, holder, created_at

(Keep raw shards off-chain and off DB — only encrypted references or holder IDs.)

---

## Implementation order (suggested)
1. Create Docker Compose + Postgres and DB migrations.
2. Build DB client helper and run migrations locally.
3. Implement Auth (register/login) + JWT middleware.
4. Implement pinataService wrapper for Pinata APIs.
5. Implement upload route and files CRUD (DB integration).
6. Create simple Solidity contract `StorageMetadata` and unit tests (compile & deploy to testnet).
7. Integrate contract call after upload (backend signs tx).
8. Implement encryption utilities (AES-GCM + Shamir).
9. Implement frontend upload flow with client-side encryption option.
10. Implement pinningMonitor service + scheduled evaluation.
11. Add tests (unit + integration) and CI workflows (GitHub Actions).
12. Harden security (env secrets, JWT rotation, HTTPS in production).

---

## Testing strategy
- Unit: authService, db client (use `pg-mem`), pinataService (mock axios), encryptionService.
- Integration: docker-compose with postgres + backend for upload flow; optional local IPFS node for full pin flow.
- Contract tests: Hardhat/Truffle unit tests and a testnet deploy step for integration.

---

## CI / Devops
- GitHub Actions: PR checks run `npm test` (backend), `npm test` (frontend), compile contracts.
- On merge to main: run build and optional testnet contract deployment (use GH secrets).
- Local dev: `docker-compose up -d`, run migrations, start backend & frontend.

---

## Security & privacy notes
- Never put Pinata or contract private keys in frontend.
- Keep shard material never stored unencrypted in DB or on-chain.
- Use TLS for all inter-service comms.
- Keep JWT secret and private keys in Vault or GH secrets.

---

## What to hand to Copilot/Antigravity next
Use the `prompt.prompts.md` file — it contains focused prompts to generate every file and module you need. Generate files one at a time and iterate.

