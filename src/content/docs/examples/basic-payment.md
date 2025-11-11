---
title: Basic Payment Example
description: Your first x402 payment workflow in n8n
---

This example shows you how to create a simple workflow that makes a payment-protected API request using x402 Pocket Nodes.

## What You'll Build

A workflow that:

1. Uses a persistent wallet
2. Calls a mock payment-protected API
3. Automatically handles the payment
4. Returns the protected data

## Prerequisites

Before starting:

- x402 Pocket Nodes installed in n8n
- Wallet created and funded (see [Quick Start](/getting-started/quick-start/))

## Workflow Overview

```
[Manual Trigger]
    → [x402 Wallet Manager]
    → [x402 Client]
    → [Display Results]
```

## Step-by-Step Guide

### Step 1: Set Up Mock Server

First, create the API endpoint we'll call:

1. **Create new workflow**: "My x402 Mock API"
2. **Add x402 Mock Server node**
3. **Configure**:

   - HTTP Method: `POST`
   - Path: `my-api`
   - Network: `Devnet`
   - Payment Amount: `10000` (0.01 USDC)
   - Description: `My first paid API`
   - Mock Response:
     ```json
     {
       "message": "Payment successful!",
       "data": {
         "userId": 123,
         "credits": 100
       }
     }
     ```
   - Verify On-Chain: `false`

4. **Activate the workflow**
5. **Copy the webhook URL** (shown in the node)

### Step 2: Create Client Workflow

Now create the workflow that will call the API:

1. **Create new workflow**: "My First x402 Payment"
2. **Add Manual Trigger node**
3. **Add x402 Wallet Manager node**
4. **Add x402 Client node**
5. **Add Code node** (to display results)
6. **Connect them all**

### Step 3: Configure Wallet Manager

Click on the x402 Wallet Manager node:

- **Network**: `Devnet`
- **Action**: `Get Wallet Info`

This provides your wallet to the Client node.

### Step 4: Configure x402 Client

Click on the x402 Client node:

- **Wallet Source**: `From Wallet Manager Node`
- **Resource URL**: [Paste your webhook URL from Step 1]
- **HTTP Method**: `POST`
- **Request Body**: `{}`
- **Auto-Pay**: `true` (checked)
- **Max Payment Amount (USDC)**: `1`
- **Protocol Format**: `Official X-402 Protocol`

**Show Transaction Details**: Leave unchecked for now

### Step 5: Add Display Code

Click on the Code node and add this JavaScript:

```javascript
// Get the API response
const apiResponse = $input.first().json;

// Extract data
const message = apiResponse.message;
const data = apiResponse.data;
const payment = apiResponse._x402Payment;

// Create a nice output
return {
  json: {
    success: true,
    message: message,
    userData: data,
    paymentDetails: {
      amount: payment.amount + " " + payment.currency,
      from: payment.sender,
      to: payment.recipient,
      time: payment.timestamp,
    },
  },
};
```

### Step 6: Run the Workflow!

1. Click **"Test Workflow"** button
2. Watch the execution flow
3. Check the output in the Code node

## Expected Output

You should see:

```json
{
  "success": true,
  "message": "Payment successful!",
  "userData": {
    "userId": 123,
    "credits": 100
  },
  "paymentDetails": {
    "amount": "0.01 USDC",
    "from": "9rKnvE7PVbpq4Ws...",
    "to": "HgWtto74ZqPAF1...",
    "time": "2024-01-15T10:30:00.000Z"
  }
}
```

Congratulations! You just made your first x402 payment! 🎉

## What Happened Behind the Scenes

Let's break down what happened:

### 1. Wallet Manager Executed

```
[Wallet Manager]
  ├─ Loaded wallet from storage
  ├─ Checked balances (10.5 USDC, 1.2 SOL)
  └─ Passed wallet data to Client
```

### 2. Client Made First Request

```
[x402 Client] → POST /webhook/my-api
[Mock Server] ← 402 Payment Required
                {
                  "maxAmountRequired": "10000",
                  "payTo": "HgWtto74...",
                  ...
                }
```

### 3. Client Created Payment

```
[x402 Client]
  ├─ Parsed payment requirements
  ├─ Checked: 0.01 USDC < 1.00 USDC limit ✓
  ├─ Checked: Balance sufficient ✓
  ├─ Created payment message
  ├─ Signed with wallet private key
  └─ Encoded as base64
```

### 4. Client Retried with Payment

```
[x402 Client] → POST /webhook/my-api
                X-Payment: eyJ4NDAy...
[Mock Server] ← 200 OK
                {
                  "message": "Payment successful!",
                  ...
                }
```

### 5. Mock Server Verified

```
[Mock Server]
  ├─ Decoded X-Payment header
  ├─ Verified amount: 10000 ✓
  ├─ Verified network: devnet ✓
  ├─ Verified signature format ✓
  ├─ Verified timestamp (< 5 min old) ✓
  ├─ Checked not duplicate ✓
  └─ Returned protected data
```

## Variations

### Use Saved Wallet

After running once, you can disconnect the Wallet Manager:

1. **Delete the connection** between Wallet Manager and Client
2. **Delete the Wallet Manager node**
3. **Change Client's Wallet Source** to "Saved Wallet (Recommended)"
4. **Run again** - it uses the saved wallet!

Perfect for scheduled workflows.

### Use Private Key

Enter your private key directly:

1. **Get private key** from Wallet Manager output (run it once)
2. **Change Wallet Source** to "Private Key (Reusable)"
3. **Paste private key** in the field
4. **Select network**: Devnet
5. **Delete Wallet Manager** node if you want
6. **Run** - works without Wallet Manager!

Great for trigger-based workflows.

### Change Payment Amount

Want to test a more expensive API?

In Mock Server:

- **Payment Amount**: `100000` (0.10 USDC)

In Client:

- **Max Payment Amount**: `0.50`

The client will now pay 0.10 USDC.

### Add Custom Headers

Need to send API keys or other headers?

In x402 Client, expand **Headers**:

- Click **Add Header**
- Name: `X-API-Key`
- Value: `your-api-key`

The headers are included in both the initial request and the payment retry.

## Common Issues

### "Insufficient balance"

**Problem**: Not enough USDC or SOL

**Solution**:

1. Run Wallet Manager alone
2. Check balances in output
3. Fund wallet if needed:
   - USDC: https://spl-token-faucet.com/?token-name=USDC-Dev
   - SOL: https://faucet.solana.com/
4. Wait 30 seconds
5. Re-run

### "Payment exceeds limit"

**Problem**: API requires more than your max

**Solution**:

- Increase **Max Payment Amount** in Client node
- OR lower **Payment Amount** in Mock Server

### "No wallet data found"

**Problem**: Client can't see wallet

**Solution**:

- Ensure Wallet Manager is connected to Client
- Verify both use the same network (Devnet)
- Try re-running Wallet Manager

### Mock Server returns 404

**Problem**: Webhook not active

**Solution**:

- Go to Mock Server workflow
- Ensure it's **Active** (toggle at top right)
- Regenerate webhook URL (deactivate → activate)
- Copy new URL to Client

## Next Steps

Now that you've made a basic payment:

### Learn More

- [Payment Flow](/concepts/payment-flow/) - Understand what happened
- [Error Handling](/examples/error-handling/) - Handle failures
- [Multiple Endpoints](/examples/multiple-endpoints/) - Call multiple APIs

### Try Advanced Features

- **Scheduled Payments**: Add Schedule Trigger
- **Webhook Triggered**: Add Webhook Trigger
- **Multiple Clients**: Call different APIs in one workflow
- **Conditional Logic**: Pay only if conditions met

### Go to Production

- **Use Mainnet**: Switch to real USDC
- **Real APIs**: Call actual x402-enabled services
- **Monitoring**: Add error handling and logging
- **Budget Control**: Set strict payment limits

## Complete Workflow JSON

Want to import this workflow directly? Here's the JSON:

```json
{
  "name": "My First x402 Payment",
  "nodes": [
    {
      "parameters": {},
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "network": "solana-devnet",
        "action": "info"
      },
      "name": "x402 Wallet Manager",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402WalletManager",
      "position": [450, 300]
    },
    {
      "parameters": {
        "walletSource": "external",
        "resourceUrl": "YOUR_WEBHOOK_URL_HERE",
        "method": "POST",
        "body": "{}",
        "autoPay": true,
        "maxPayment": 1
      },
      "name": "x402 Client",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402Client",
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "const apiResponse = $input.first().json;\n\nreturn {\n  json: {\n    success: true,\n    message: apiResponse.message,\n    userData: apiResponse.data,\n    paymentDetails: apiResponse._x402Payment\n  }\n};"
      },
      "name": "Display Results",
      "type": "n8n-nodes-base.code",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "x402 Wallet Manager", "type": "main", "index": 0 }]]
    },
    "x402 Wallet Manager": {
      "main": [[{ "node": "x402 Client", "type": "main", "index": 0 }]]
    },
    "x402 Client": {
      "main": [[{ "node": "Display Results", "type": "main", "index": 0 }]]
    }
  }
}
```

**To import**:

1. Copy the JSON above
2. Replace `YOUR_WEBHOOK_URL_HERE` with your mock server URL
3. In n8n: Settings → Import from File → Paste JSON
4. Execute!

---

**You're now ready to build real x402 payment workflows!** 🚀
