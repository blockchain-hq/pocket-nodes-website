---
title: Installation
description: Install x402test and set up your testing environment
---


This guide will walk you through installing x402test and setting up your development environment.

## Prerequisites

Before installing x402test, make sure you have:

- **Node.js**: Version 18 or higher
- **pnpm**, **npm**, or **yarn**: Package manager
- **Solana CLI** (optional): For running a local validator

## Install x402test

Add x402test to your project as a development dependency:

```bash
pnpm add -D x402test

npm install --save-dev x402test

yarn add -D x402test
```

## Initialize Configuration

Run the initialization command to create a configuration file and test wallet:

```bash
npx x402test init
```

This will:

- Create a `x402test.config.js` configuration file
- Generate a test wallet with auto-funded USDC
- Save wallet information to `.x402test-wallets.json`

### Configuration File

The generated configuration file looks like this:

```javascript
// x402test.config.js
export default {
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",

  recipient: "YOUR_WALLET_ADDRESS",

  routes: {
    "/api/premium": {
      price: "0.10",
      description: "Premium content access",
      response: {
        data: "This is premium content!",
        timestamp: Date.now(),
      },
    },

    "/api/data": {
      price: "0.01",
      description: "Data API access",
      response: (req) => ({
        method: req.method,
        path: req.path,
        data: { message: "Your data here" },
      }),
    },
  },
};
```

## Set Up Local Solana Validator

For local testing, you'll need a Solana test validator:

### Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Start Test Validator

```bash
solana-test-validator
```

The validator should run on `http://localhost:8899` by default.

### Verify Installation

Check that the validator is running:

```bash
solana cluster-version --url http://localhost:8899
```

## Verify x402test Installation

Test your installation by starting the mock server:

```bash
npx x402test start
```

You should see output like:

```
✔ x402test Mock Server Started
   Port: 4402
   Network: solana-devnet
   Recipient: YOUR_WALLET_ADDRESS

✔ Configured Routes:
   /api/premium
     Price: 0.10 USDC
     Description: Premium content access
   /api/data
     Price: 0.01 USDC
     Description: Data API access

✔ Ready to accept payments at http://localhost:4402
```

## Project Structure

After initialization, your project should have:

```
your-project/
├── x402test.config.js          # Configuration file
├── .x402test-wallets.json      # Test wallets (auto-generated)
├── .x402test-signatures.json   # Used signatures (auto-generated)
└── package.json
```

## Git Ignore

Add these files to your `.gitignore`:

```
.x402test-wallets.json
.x402test-signatures.json
x402test.config.js  # Optional: commit if you want to share config
```

## Next Steps

Now that you have x402test installed:

- [Quick Start Guide](/quick-start) - Make your first payment request
- [How x402 Works](/how-it-works) - Understand the payment flow
- [CLI Reference](/cli/overview) - Learn all CLI commands
