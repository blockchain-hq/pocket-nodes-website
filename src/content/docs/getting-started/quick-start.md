---
title: Quick Start
description: Create your first x402 payment workflow in n8n
---

This guide will help you create your first x402 payment workflow in n8n. We'll set up a wallet, fund it with test tokens, and make a payment-protected API request.

## Step 1: Setup Your Wallet

### Create Wallet Setup Workflow

1. In n8n, create a new workflow named "x402 Wallet Setup"
2. Add a **Manual Trigger** node
3. Add an **x402 Wallet Manager** node after the trigger
4. Connect the nodes

### Configure Wallet Manager

Click on the x402 Wallet Manager node and configure:

- **Network**: `Devnet` (for testing)
- **Action**: `Get Wallet Info`

### Execute and Get Address

1. Click **"Test Workflow"** at the top right
2. Check the output panel on the right
3. Copy the `walletAddress` value

Your output will look like:

```json
{
  "walletAddress": "9rKnvE7PVbpq4...",
  "network": "solana-devnet",
  "balances": {
    "usdc": 0,
    "sol": 0
  },
  "status": "needs_funding",
  "fundingInstructions": {
    "steps": [
      "Get devnet USDC from: https://spl-token-faucet.com/?token-name=USDC-Dev",
      "Get devnet SOL: https://faucet.solana.com/",
      "Wait for confirmation (~30 seconds)",
      "Re-run this node to verify balance"
    ]
  }
}
```

## Step 2: Fund Your Wallet

### Get Test USDC

1. Visit: [https://spl-token-faucet.com/?token-name=USDC-Dev](https://spl-token-faucet.com/?token-name=USDC-Dev)
2. Paste your wallet address
3. Click "Confirm Airdrop"
4. Wait ~30 seconds

### Get Test SOL (for transaction fees)

1. Visit: [https://faucet.solana.com/](https://faucet.solana.com/)
2. Paste your wallet address
3. Click "Airdrop"
4. Wait ~30 seconds

### Verify Funding

1. Go back to your n8n workflow
2. Click **"Test Workflow"** again
3. Check the output - you should now see:

```json
{
  "walletAddress": "9rKnvE7PVbpq4...",
  "network": "solana-devnet",
  "balances": {
    "usdc": 10,
    "sol": 1.5
  },
  "status": "ready",
  "message": "Wallet is funded and ready to use!"
}
```

## Step 3: Test with Mock Server

Now let's test making a payment using the built-in mock server.

### Create Test Workflow

1. Create a new workflow named "x402 Payment Test"
2. Add these nodes in order:
   - **Manual Trigger**
   - **x402 Wallet Manager**
   - **x402 Client**

### Configure Wallet Manager

In the x402 Wallet Manager node:

- **Network**: `Devnet`
- **Action**: `Get Wallet Info`

### Set Up Mock Server

1. Create another workflow named "x402 Mock API Server"
2. Add **x402 Mock Server** node
3. Configure it:

   - **HTTP Method**: `POST`
   - **Path**: `test-api`
   - **Network**: `Devnet`
   - **Payment Amount**: `10000` (0.01 USDC)
   - **Description**: `Test API access`
   - **Mock Response**: `{"status": "success", "data": "Test payment worked!"}`
   - **Verify On-Chain**: `false` (off for testing)

4. **Activate the workflow** (toggle at top right)
5. Copy the webhook URL from the node

### Configure Client Node

In your "x402 Payment Test" workflow, click the x402 Client node:

- **Wallet Source**: `From Wallet Manager Node`
- **Resource URL**: [Paste your webhook URL from mock server]
- **HTTP Method**: `POST`
- **Request Body**: `{}`
- **Auto-Pay**: `true`
- **Max Payment Amount**: `1` (USDC)

### Run Your First Payment!

1. Ensure the Mock Server workflow is **Active**
2. Go to your Test workflow
3. Click **"Test Workflow"**
4. Watch the execution!

You should see:

```json
{
  "status": "success",
  "data": "Test payment worked!",
  "_x402Payment": {
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "ABC123...",
    "sender": "9rKnvE7PVbpq4...",
    "network": "solana-devnet",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

Congratulations! You just made your first x402 payment! 🎉

## Step 4: Understanding What Happened

The x402 Client node automatically:

1. **Sent first request** to your mock server (no payment)
2. **Received 402** response with payment requirements
3. **Created payment** using your wallet
4. **Signed transaction** on Solana blockchain
5. **Retried request** with payment proof in `X-Payment` header
6. **Got the data** from the protected endpoint

All of this happened automatically in the background!

## Optional: Try Different Wallet Sources

The x402 Client supports multiple wallet sources:

### Option 1: Saved Wallet (Persistent)

After connecting Wallet Manager once, the wallet is saved:

1. **Connect Wallet Manager** → Run workflow once
2. **Disconnect Wallet Manager** (delete the connection)
3. **Change Wallet Source** to "Saved Wallet (Recommended)"
4. **Run again** - it uses the saved wallet!

This is perfect for scheduled workflows.

### Option 2: Private Key (Reusable)

Enter your private key directly (from Wallet Manager output):

1. Set **Wallet Source** to "Private Key (Reusable)"
2. Paste your **Private Key** from Wallet Manager output
3. Select **Network** (Devnet)
4. No connection to Wallet Manager needed!

Great for workflows with triggers (schedule, webhook, etc.)

## What's Next?

Now that you've made your first payment:

### Learn More

- [Wallet Setup Guide](/concepts/wallet-setup/) - Detailed wallet management
- [Payment Flow](/concepts/payment-flow/) - How x402 protocol works
- [Mock Server](/concepts/mock-server/) - More about testing

### Try Examples

- [Basic Payment](/examples/basic-payment/) - Simple payment workflow
- [Scheduled Payments](/examples/scheduled-payments/) - Automated payments
- [Multiple Endpoints](/examples/multiple-endpoints/) - Call multiple APIs

### Go to Production

- [Using Mainnet](/advanced/mainnet/) - Deploy with real USDC
- [Payment Limits](/advanced/payment-limits/) - Safety configuration
- [Error Handling](/examples/error-handling/) - Handle failures gracefully

## Troubleshooting

### "Insufficient balance" error

- Check your wallet balances in Wallet Manager
- Fund with more USDC/SOL from the faucets
- Wait 30 seconds after funding

### "No wallet data found" error

- Ensure Wallet Manager is connected to Client
- Check that wallets are on the same network (both Devnet)
- Try re-running Wallet Manager node

### "Transaction not found" error

- This is rare - retry the workflow
- RPC nodes can be slow on devnet
- Wait a few seconds and retry

### Mock Server not responding

- Ensure Mock Server workflow is **Active**
- Check the webhook URL is correct
- Try regenerating the webhook URL (deactivate → activate)
