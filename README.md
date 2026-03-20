# Decentralised_StorageAreaNetworks (SAN)

**This project** is a proof-of-concept **Decentralized Cloud Storage System** that prioritizes security, privacy, and transparency. It leverages **Threshold Cryptography**, **IPFS**, and **Blockchain** technology to ensure that files are encrypted, their keys are distributed, and their metadata is immutable.

---

## 💡 The Core Idea

The central philosophy of this project is **"Trust No Single Entity"**. 
Instead of storing your file and its key on a single server (like traditional cloud storage), this project implements a zero-trust architecture:

1.  **Client-Side Encryption**: Files are encrypted *before* they leave your browser. The server never sees the unencrypted file.
2.  **Secret Sharing**: The encryption key is **never stored intact**. It is mathematically split into 5 "shards".
3.  **Distributed Key Management**: These shards are distributed across 5 independent nodes (Alpha, Beta, Gamma, Delta, Epsilon). A threshold of **3 shards** is required to reconstruct the key.
4.  **Blockchain Verification**: Every file upload is recorded on a local Ethereum blockchain (Ganache), providing an immutable proof of existence and ownership.
5.  **IPFS Storage**: The encrypted file blob is stored on the InterPlanetary File System (IPFS), ensuring decentralized and content-addressed storage.

---

## 🔄 The Process (Workflow)

### 1. Upload Flow 📤
1.  **Generation**: The client generates a high-entropy **AES-256-GCM** key.
2.  **Encryption**: The file is encrypted locally in the browser using this key.
3.  **Sharding**: The key is split into **5 shards** using Secret Sharing.
4.  **Distribution**:
    *   The **Encrypted File** is uploaded to IPFS.
    *   The **Key Shards** are sent to the backend, which distributes them to available nodes in the network database.
5.  **Blockchain**: The backend calls a Smart Contract to store the file's CID, name, and size on the Ethereum blockchain.

### 2. Download & Decryption Flow 📥
1.  **Retrieval**: The client fetches the encrypted file from the IPFS Gateawy.
2.  **Shard Gathering**: The client requests key shards from the network. It needs at least **3 valid shards**.
3.  **Reconstruction**: The client mathematically executes the Lagrange Interpolation to reconstruct the original AES key in memory.
4.  **Decryption**: The file is decrypted locally and presented to the user.

### 3. Node Management (Admin) 🔧
*   **Visualization**: View the active network topology.
*   **Simulation**: Simulate **Node Failures** (kill a node) and **Node Recoveries**.
*   **Self-Healing**: When a node fails, its shards are migrated. When it recovers, the network rebalances load.

---

## 🛠️ Technical Stack

*   **Frontend**: React, Vite, Cytoscape.js (Visualization), `secrets.js-grempe` (Sharding).
*   **Backend**: Node.js, Express, `ethers.js` (Blockchain), `pg` (PostgreSQL).
*   **Database**: PostgreSQL (Metadata, Node State, Shards).
*   **Blockchain**: Ganache (Local Ethereum Testnet), Solidity (Smart Contract).
*   **Storage**: IPFS (Local Node).
*   **Infrastructure**: Docker, Docker Compose.

---

## 📸 Screenshots

|   |   |
|:---:|:---:|
| <img src="Images/Screenshot%20from%202025-12-15%2001-57-30.png" width="400" /> | <img src="Images/Screenshot%20from%202025-12-15%2001-57-45.png" width="400" /> |
| <img src="Images/Screenshot%20from%202025-12-15%2001-58-26.png" width="400" /> | <img src="Images/Screenshot%20from%202025-12-15%2001-58-41.png" width="400" /> |

---

## 🚀 Quick Start Guide

### Prerequisites
*   **Docker & Docker Compose** (Essential)
*   **Node.js 18+** (For local development scripts)

### 1. Start Infrastructure
Launch the database, IPFS node, and Blockchain (Ganache).
```bash
docker compose up -d
```

### 2. Initialize Database
Create the tables and seed initial data.
```bash
# Set DB URL (Default password: sa_password)
export DATABASE_URL=postgresql://sa_user:sa_password@localhost:5432/storage_db

# Run Migration
node backend/scripts/runMigration.js
```

### 3. Deploy Smart Contract
Deploy the `StorageMetadata` contract to the local Ganache blockchain.
```bash
node backend/scripts/deployContract.js
```
*This will update `backend/.env` with the new Contract Address.*

### 4. Configure Backend
Create a `.env` file in the `backend/` directory:

```env
PORT=4000

# Postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=storage_db
POSTGRES_USER=sa_user
POSTGRES_PASSWORD=sa_password
DATABASE_URL=postgresql://sa_user:sa_password@localhost:5432/storage_db

# JWT
JWT_SECRET=dev_secret_key_change_in_prod
JWT_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# Pinata (Placeholders - User needs to fill these or use local IPFS fallback if implemented)
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_JWT=

# Blockchain (Placeholders)
ETH_PROVIDER_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x9DE9028f3165d5ac05D8d0Bb5C81E5fe025b4Dd4
CONTRACT_PRIVATE_KEY=
```

### 5. Start Services

**Backend API (Port 4000)**
```bash
cd backend
npm install
npm start
```

**Frontend App (Port 5173)**
```bash
cd frontend
npm install
npm run dev
```

---

## 🖥️ Usage

### User View (`http://localhost:5173`)
1.  **Register/Login**: Create an account.
2.  **Upload**: Select a file, check "Enable Threshold Encryption", and upload.
3.  **My Files**: Click a file to view details.
4.  **Decrypt**: Click "Reconstruct Key & Decrypt" to download your file.

### Admin Dashboard (`http://localhost:5173/admin`)
1.  **Node Topology**: Visualize the 5-node cluster.
    *   Click "Kill Node" to simulate failure (watch shards migrate in logs).
    *   Click "Recover Node" to bring it back (watch load rebalancing).
2.  **Blockchain Monitor**: Switch tabs to view real-time Blockchain stats (Block Height, Gas Price, Transaction Ledger).

---

## ⚠️ Troubleshooting

**"Decryption Failed"**
*   Ensure your IPFS node allows CORS (The setup script handles this).
*   Ensure you are using `http://localhost:5173` to access the app.

**Blockchain Connection Error**
*   Check if Ganache is running: `docker ps`.
*   If you restarted Ganache, you **MUST** redeploy the contract (`node backend/scripts/deployContract.js`).
