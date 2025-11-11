---
title: x402 Client Node
description: Make HTTP requests to x402-enabled APIs with automatic payment handling
---

The x402 Client node is the core component for making payment-protected API requests in your n8n workflows. It automatically handles 402 responses, creates payments, and retries with payment proofs.

## Overview

The x402 Client node:

- Detects 402 Payment Required responses
- Automatically creates and signs payments
- Retries requests with payment proof
- Returns protected data to your workflow
- Supports configurable payment limits
- Works with all HTTP methods (GET, POST, PUT, DELETE)

## Node Configuration

### Wallet Source

Choose how to provide wallet credentials:

**Saved Wallet (Recommended)**

- Connect Wallet Manager once, wallet is saved
- Future executions use saved wallet automatically
- Perfect for scheduled workflows

**Private Key (Reusable)**

- Enter your private key directly
- Wallet reused across all executions
- Great for trigger-based workflows

**From Wallet Manager Node**

- Live connection to Wallet Manager
- Always uses latest wallet state
- Best for dynamic wallet management

**Auto-Generate Per Node**

- Generates unique wallet per node
- Requires funding each time
- Not recommended for production

### Resource URL

The URL of the x402-enabled API endpoint:

```
https://api.example.com/premium-data
http://localhost:3000/webhook/my-api
```

### HTTP Method

Select the HTTP method for your request:

- GET - Retrieve data
- POST - Send data
- PUT - Update resource
- DELETE - Remove resource

### Request Body

For POST and PUT requests, specify the JSON body:

```json
{
  "query": "example",
  "limit": 10
}
```

Use n8n expressions for dynamic values:

```json
{
  "userId": "{{$json.id}}",
  "timestamp": "{{new Date().toISOString()}}"
}
```

### Headers

Add custom HTTP headers:

**Name**: `X-API-Key`
**Value**: `your-api-key-here`

Or use expressions:

**Name**: `Authorization`
**Value**: `Bearer {{$json.token}}`

### Auto-Pay

When enabled, the node automatically:

1. Detects 402 responses
2. Checks payment amount against limit
3. Creates and signs payment
4. Retries with payment proof
5. Returns the protected data

When disabled, the node will fail with an error if payment is required.

### Max Payment Amount (USDC)

Safety limit to prevent overspending:

```
Development: 0.10 USDC
Production: 1.00 USDC
High-value APIs: 5.00 USDC
```

If the API requires more than this amount, the node throws an error instead of paying.

### Protocol Format

**Official X-402 Protocol** (Recommended)

- Standard x402 specification
- Signature-based payment proof
- No blockchain transaction needed (off-chain)
- Fast and efficient

**Signed Transaction (Legacy)**

- Pre-signed Solana transaction
- Compatible with custom implementations
- Can be settled on-chain
- Requires more setup

## Output Data

The x402 Client node returns:

### Successful Response

```json
{
  "data": {
    // API response data
  },
  "_x402Payment": {
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "ABC123...",
    "sender": "9rKnvE7...",
    "network": "solana-devnet",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Free Endpoint (No Payment)

If the endpoint doesn't require payment (returns 200 immediately):

```json
{
  "result": "data from API"
  // No _x402Payment field
}
```

## Using the Output

Access data in subsequent nodes:

### Get API Data

```javascript
{
  {
    $json.data;
  }
}
```

### Get Payment Amount

```javascript
{
  {
    $json._x402Payment.amount;
  }
}
```

### Check if Payment Was Made

```javascript
{
  {
    $json._x402Payment !== undefined;
  }
}
```

### Get Transaction Timestamp

```javascript
{
  {
    $json._x402Payment.timestamp;
  }
}
```

## Common Patterns

### Call Single API

```
[Trigger]
    ↓
[x402 Wallet Manager]
    ↓
[x402 Client]
  - URL: https://api.example.com/data
    ↓
[Process Data]
```

### Call Multiple APIs

```
[Trigger]
    ↓
[x402 Wallet Manager]
    ↓
[x402 Client 1] Premium Data (0.01 USDC)
    ↓
[x402 Client 2] Analytics (0.05 USDC)
    ↓
[Merge Results]
```

### Conditional Payment

```
[Trigger]
    ↓
[x402 Wallet Manager]
    ↓
[IF] Balance > 1 USDC?
    ├─ YES → [x402 Client] Call paid API
    └─ NO → [Send Alert] Low balance
```

### Mix Free and Paid APIs

```
[Trigger]
    ↓
[HTTP Request] Free endpoint (no payment)
    ↓
[x402 Client] Paid endpoint (with payment)
    ↓
[Combine Data]
```

## Advanced Options

### Show Transaction Details

Enable to include additional payment metadata in output:

```json
{
  "_x402Payment": {
    "amount": "0.01",
    "scheme": "exact",
    "resource": "/api/premium-data"
    // ... more details
  }
}
```

### Clear Saved Wallet

Only for "Saved Wallet" mode. Clears the saved wallet so you can set up a new one.

### Reset Wallet

Only for "Auto-Generate" mode. Generates a new wallet for this node.

## Troubleshooting

### "No wallet data found"

**Problem**: Client can't access wallet

**Solutions**:

- Ensure Wallet Manager is connected (for "From Wallet Manager" mode)
- Check saved wallet exists (for "Saved Wallet" mode)
- Enter private key (for "Private Key" mode)

### "Insufficient balance"

**Problem**: Not enough USDC or SOL

**Solutions**:

1. Run Wallet Manager alone
2. Check balances in output
3. Fund wallet at faucets (devnet) or send funds (mainnet)
4. Re-run workflow

### "Payment exceeds limit"

**Problem**: API requires more than max allowed

**Solutions**:

- Increase "Max Payment Amount" if acceptable
- Use a different API
- Check API pricing documentation

### "Payment rejected by server"

**Problem**: Server didn't accept payment

**Solutions**:

- Check console logs for details
- Verify network matches (both devnet or both mainnet)
- Ensure wallet has sufficient balance
- Try with "Official X-402 Protocol" format

## Best Practices

1. **Always set payment limits** to prevent overspending
2. **Use Saved Wallet** for production workflows
3. **Monitor balances** regularly
4. **Test on devnet** before mainnet
5. **Enable "Continue On Fail"** for error handling
6. **Log payment details** for auditing

## What's Next?

- [Wallet Manager](/api/wallets/) - Managing wallets
- [Mock Server](/concepts/mock-server/) - Testing setup
- [Error Handling](/examples/error-handling/) - Handle failures
- [Multiple Endpoints](/examples/multiple-endpoints/) - Advanced patterns
