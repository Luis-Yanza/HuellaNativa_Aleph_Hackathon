# 🌿 HuellaNativa

**Empowering Producers through Immutable Blockchain Traceability & Decentralized Storage**

![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)
![Aleph.im](https://img.shields.io/badge/Aleph.im-0054ff?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)

*This project was built for the Aleph.im Blockchain Hackathon.*

---

## 📖 The Vision

In the current supply chain, the hard work of local farmers and artisans (producing Fine Aroma Cocoa, Specialty Coffee, or Toquilla Straw Hats) is often erased. Their products are mixed in generic batches, forcing them to sell at poverty prices to intermediaries. 

**HuellaNativa** is a decentralized traceability bridge that returns the story and identity to the product. By recording each step of the agricultural or artisanal process as an immutable cryptographic event, we empower producers to prove their origin, quality, and effort. 

**The result?** They no longer compete on a blind price; they compete on true demonstrable value verified by the blockchain.

[🎥 Watch our Pitch Video Here](#) <!-- Rellenar Link de YouTube aquí -->

---

## 🏗️ Architecture & Tech Stack

Our solution uses a hybrid decentralized architecture designed for cost-efficiency and maximum transparency:

* **Layer 1 (State & Security) - Ethereum / Solidity:** We use highly optimized Smart Contracts deployed on the **Sepolia Testnet**. Instead of storing heavy strings on-chain linearly, we pack multi-variable data (Product, Producer Name, Production Date) into compressed JSON formats within the contract structs, and rely on Ethereum `Events` for building our decentralized timeline seamlessly.
* **Layer 2 (Decentralized Storage) - Aleph.im:** We successfully integrated `aleph-sdk-ts` to allow producers to upload cryptographic evidence (photos of the farm, organic certificates) directly from the browser. The resulting Aleph Hash is then tied indelibly to the Ethereum batch record.
* **Frontend & Web3 Integration - Next.js & Ethers.js:** A beautifully crafted, responsive UI built with Tailwind CSS. It connects seamlessly to MetaMask, incorporating custom fallbacks and aggressive Webpack mocking to ensure Aleph's backend dependencies run flawlessly in a modern ESM browser environment.

---

## ✨ Key Technical Achievements

1. **Custom Webpack Polyfills for Aleph:** Engineered a custom `next.config.mjs` setup hijacking `window.ethereum.request` to dynamically absorb Aleph's default Mainnet routing, explicitly keeping the user safely in the Sepolia Testnet while preserving full `store.publish` functionality.
2. **Double-Layered Data Structure:** To bypass gas limits and prevent contract redeployments, our React frontend dynamically encodes extended form capabilities into JSON arrays that are securely anchored into the Smart Contract State (`inventario`). The 'Consumer View' timeline parses these on readability fallback automatically.
3. **Role-Based Access Control:** Only authorized wallet addresses can update a batch's state in the supply chain via Ethers.js v6.

---

## 🚀 How to Run Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [MetaMask](https://metamask.io/) browser extension installed
* **Sepolia Testnet** configured in MetaMask with testnet SepoliaETH.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Luis-Yanza/HuellaNativa_Aleph_Hackathon.git
   cd HuellaNativa_Aleph_Hackathon
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd packages/frontend
   npm install
   ```

3. **Configure Environment:**
   Ensure you have a `.env.local` file in `packages/frontend` with your RPC URL.
   ```env
   NEXT_PUBLIC_RPC_URL=https://rpc2.sepolia.org
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the dApp.

---
*Built with ❤️ in Ecuador.*
