---
title: Mock Server
description: Test x402 integration without real blockchain transactions
---

The x402 Mock Server node lets you test the complete x402 payment flow in n8n without making real blockchain transactions or spending actual money.

## What is the Mock Server?

The Mock Server is a webhook-based n8n node that simulates an x402-enabled API endpoint. It:

- Returns **402 Payment Required** responses
- Accepts payment proofs in `X-Payment` headers
- Verifies payment format and signatures
- Returns mock data after successful payment
- Tracks used signatures (replay protection)

Perfect for development, testing, and learning x402!

## Setting Up Mock Server

###Step 1: Create Mock Server Workflow

1. Create a new workflow named "x402 Mock API"
2. Add **x402 Mock Server** node
3. The node is a webhook, so it will generate a URL

### Step 2: Configure the Node

Click on the Mock Server node to configure:

**HTTP Method**: Choose request method

- GET, POST, PUT, DELETE

**Path**: Webhook path segment

- Example: `test-api`
- Full URL will be: `https://your-n8n.com/webhook/test-api`

**Network**: Blockchain network

- Devnet (for testing)
- Mainnet (for production)

**Payment Amount**: Required payment in smallest units

- Example: `10000` = 0.01 USDC (6 decimals)
- Example: `100000` = 0.10 USDC

**Description**: What the API does

- Shown in 402 response
- Helps clients understand the charge

**Mock Response**: Data to return after payment

- JSON object
- Can be static or dynamic (using expressions)

**Verify On-Chain**: Settlement mode

- `false` = Signature verification only (fast, no blockchain)
- `true` = Actual on-chain settlement (requires funded wallet)

### Step 3: Activate the Workflow

1. Click **"Active"** toggle at the top right
2. Copy the webhook URL from the node
3. Use this URL in your x402 Client nodes

## Example Configurations

### Simple Data API (0.01 USDC)

```
HTTP Method: POST
Path: data-api
Network: Devnet
Payment Amount: 10000
Description: Simple data access
Mock Response: {"status": "success", "data": [1, 2, 3]}
Verify On-Chain: false
```

### Premium Content (0.10 USDC)

```
HTTP Method: GET
Path: premium-content
Network: Devnet
Payment Amount: 100000
Description: Premium content access
Mock Response: {"content": "Premium data here", "timestamp": "{{new Date().toISOString()}}"}
Verify On-Chain: false
```

### AI API Simulation (0.25 USDC)

```
HTTP Method: POST
Path: ai-inference
Network: Devnet
Payment Amount: 250000
Description: AI model inference
Mock Response: {"model": "gpt-4", "result": "AI generated response", "tokens": 150}
Verify On-Chain: false
```

## Using the Mock Server

### Test Workflow Setup

```
[Manual Trigger]
    ↓
[x402 Wallet Manager]
  - Network: Devnet
  - Action: Get Wallet Info
    ↓
[x402 Client]
  - Resource URL: [Your webhook URL]
  - Method: POST
  - Auto-Pay: true
  - Max Payment: 1.00
    ↓
[Process Response]
```

### First Request (No Payment)

When the Client first calls your mock server:

```json
// Client sends
GET /webhook/test-api

// Mock Server responds
HTTP 402 Payment Required
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-devnet",
    "maxAmountRequired": "10000",
    "resource": "/webhook/test-api",
    "description": "Simple data access",
    "payTo": "[Mock server's wallet address]",
    "asset": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
  }]
}
```

### Second Request (With Payment)

Client automatically retries with payment:

```json
// Client sends
GET /webhook/test-api
X-Payment: eyJ4NDAyVmVyc2lvbiI6MSw...

// Mock Server responds
HTTP 200 OK
{
  "status": "success",
  "data": [1, 2, 3],
  "_payment": {
    "amount": "0.01",
    "from": "9rKnvE...",
    "verified": true
  }
}
```

## Mock Server Output

The Mock Server node provides execution output for monitoring:

### Payment Required Event

```json
{
  "event": "payment_required",
  "mockServerWallet": {
    "address": "HgWtto74ZqPAF1G1pvTM61GHGxsH4rBPtx6nBFjqM52d",
    "network": "solana-devnet",
    "createdAt": "2025-11-10T12:00:00.000Z",
    "solBalance": 0.5,
    "explorerUrl": "https://explorer.solana.com/address/...",
    "fundingInstructions": "Get devnet SOL: https://faucet.solana.com/"
  },
  "paymentRequested": {
    "amount": "10000",
    "amountDisplay": "0.010000 USDC",
    "description": "Simple data access"
  }
}
```

### Payment Verified Event

```json
{
  "event": "payment_verified_offchain",
  "mockServerWallet": {
    "address": "HgWtto74ZqPAF1G1pvTM61GHGxsH4rBPtx6nBFjqM52d",
    "network": "solana-devnet"
  },
  "verification": {
    "method": "off-chain",
    "status": "verified"
  },
  "mockResponse": {
    "status": "success",
    "data": [1, 2, 3]
  }
}
```

## Wallet Management

### Auto-Generated Wallet

The Mock Server automatically generates a persistent wallet:

- **Generated once** on first request
- **Persists** across all requests and workflow runs
- **Separate wallets** for devnet and mainnet
- **Visible** in execution output

### Finding Your Wallet Address

1. **Check Output Panel**: After first request, check the node's output
2. **Look for** `mockServerWallet.address`
3. **Copy the address** for funding (if using on-chain mode)

### Funding the Wallet (For On-Chain Mode)

Only needed if `Verify On-Chain` is enabled:

**Devnet**:

```bash
# Get SOL
solana airdrop 0.5 [YOUR_WALLET_ADDRESS] --url devnet

# Get USDC
# Visit: https://spl-token-faucet.com/?token-name=USDC-Dev
# Paste your wallet address
```

**Mainnet**:

- Send real SOL and USDC to the wallet address
- Only for production use

## Verification Modes

### Off-Chain (Default)

**What it does**:

- Verifies payment signature format
- Checks amount, network, timestamp
- No blockchain interaction
- Instant verification

**Use for**:

- Development and testing
- Learning x402
- Rapid iteration
- Demo workflows

**Advantages**:

- No funding needed
- Instant responses
- No blockchain fees
- Works offline

### On-Chain

**What it does**:

- Everything from off-chain mode
- PLUS: Submits transaction to Solana
- Verifies on blockchain
- Mock server actually receives USDC

**Use for**:

- Production testing
- End-to-end validation
- Regulatory compliance
- Real money flow testing

**Requirements**:

- Mock server wallet must have SOL (for fees)
- Client must have USDC and SOL
- Internet connection
- ~5-10 seconds per request

## Dynamic Responses

Use n8n expressions in mock responses:

### Timestamp

```json
{
  "data": "response",
  "timestamp": "{{new Date().toISOString()}}"
}
```

### Request Data

```json
{
  "echo": "{{$json}}",
  "method": "{{$requestObject.method}}",
  "path": "{{$requestObject.path}}"
}
```

### Random Data

```json
{
  "random": "{{Math.random()}}",
  "id": "{{Math.floor(Math.random() * 1000)}}"
}
```

## Testing Scenarios

### Test Basic Payment Flow

```
Purpose: Verify payment handling works
Config:
  - Amount: 10000 (0.01 USDC)
  - Verify On-Chain: false
Expected: Client pays, gets data
```

### Test Payment Limits

```
Purpose: Ensure client respects limits
Config:
  - Amount: 5000000 (5.00 USDC)
Client:
  - Max Payment: 1.00 USDC
Expected: Client rejects (exceeds limit)
```

### Test Insufficient Balance

```
Purpose: Handle low balance gracefully
Setup:
  - Client wallet: 0.005 USDC
  - Required: 0.01 USDC
Expected: Client error "Insufficient balance"
```

### Test On-Chain Settlement

```
Purpose: Validate full blockchain flow
Config:
  - Amount: 10000
  - Verify On-Chain: true
  - Mock server wallet funded with SOL
Expected: Transaction on blockchain
```

### Test Replay Protection

```
Purpose: Prevent payment reuse
Setup:
  1. Make successful payment
  2. Capture X-Payment header
  3. Try to reuse same header
Expected: Server rejects duplicate
```

## Troubleshooting

### "No wallet data found" in Client

**Problem**: Client can't find wallet

**Solutions**:

- Ensure Wallet Manager is connected
- Check both nodes use same network
- Re-run Wallet Manager node

### "Transaction not found" with On-Chain

**Problem**: Transaction submitted but verification fails

**Solutions**:

- Wait longer (RPC can be slow on devnet)
- Retry the workflow
- Check Solana explorer for transaction

### Mock Server not responding

**Problem**: Webhook returns 404

**Solutions**:

- Ensure workflow is **Active**
- Check webhook URL is correct
- Try deactivating and reactivating workflow

### "Insufficient balance" but wallet is funded

**Problem**: Balance check fails despite funding

**Solutions**:

- Wait 30 seconds after funding
- Re-run Wallet Manager to refresh balance
- Check correct network (devnet vs mainnet)

## Real-World Test Workflow

Here's a complete test workflow:

```
┌─────────────────────┐
│  Manual Trigger     │
└──────────┬──────────┘
           │
           ↓
┌────────────────────────┐
│  x402 Wallet Manager   │
│  - Network: Devnet     │
│  - Action: Get Info    │
└──────────┬─────────────┘
           │
           ↓
┌────────────────────────┐
│  x402 Client           │
│  - URL: Mock webhook   │
│  - Auto-Pay: true      │
│  - Max: 0.10 USDC      │
└──────────┬─────────────┘
           │
           ↓
┌────────────────────────┐
│  IF Node               │
│  {{$json.status}}      │
│  === "success"         │
└──────────┬─────────────┘
      ┌────┴─────┐
      ↓          ↓
  Success    Failure
   Path       Path
```

## What's Next?

- [Payment Flow](/concepts/payment-flow/) - Understanding the process
- [Basic Payment](/examples/basic-payment/) - Your first payment
- [Error Handling](/examples/error-handling/) - Handle failures
- [Multiple Endpoints](/examples/multiple-endpoints/) - Test variations
