---
title: How x402 Works
description: Understanding the x402 payment protocol and how it integrates with n8n
---

The x402 protocol enables micropayments for API access using HTTP status code 402 Payment Required. Here's how x402 Pocket Nodes makes this seamless in n8n workflows.

## The x402 Protocol

### HTTP 402 Payment Required

The HTTP 402 status code was reserved for future digital payment systems. The x402 protocol implements this vision:

- **API charges per request** instead of subscriptions
- **Micropayments** enable pay-as-you-go pricing
- **Blockchain settlement** ensures transparency and security
- **No accounts needed** - just a crypto wallet

## Payment Flow in n8n

Here's what happens when your n8n workflow makes a payment-protected API request:

### 1. Initial Request (No Payment)

```
[x402 Client Node]
    ↓
GET https://api.example.com/premium-data
Headers: { Accept: "application/json" }
```

The client makes a standard HTTP request without any payment information.

### 2. Server Returns 402 Payment Required

```
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-devnet",
    "maxAmountRequired": "10000",
    "resource": "/premium-data",
    "description": "Premium data access",
    "payTo": "ABC123xyz...",
    "asset": "4zMMC9srt5...",
    "maxTimeoutSeconds": 300
  }]
}
```

The server responds with:

- **Payment amount** required (in smallest units)
- **Recipient wallet** address
- **Token/asset** to use (USDC mint address)
- **Network** (Solana devnet/mainnet)
- **Timeout** for payment validity

### 3. x402 Client Detects 402

The x402 Client node automatically:

- Detects the 402 status code
- Parses the payment requirements
- Checks if payment amount is within limits

### 4. Payment Creation

The client creates a payment proof:

```typescript
{
  x402Version: 1,
  scheme: "exact",
  network: "solana-devnet",
  payload: {
    signature: "5YGc9L...",  // Transaction signature
    from: "9rKnvE...",        // Client wallet
    amount: "10000",          // Amount in smallest units
    mint: "4zMMC9...",        // USDC mint address
    timestamp: 1699999999     // Current timestamp
  }
}
```

The payload includes:

- **Signature**: Signed message proving wallet ownership
- **From**: Client's wallet address
- **Amount**: Exact amount being paid
- **Mint**: Token/asset being transferred
- **Timestamp**: Payment creation time (for replay protection)

### 5. Request Retry with Payment

```
GET https://api.example.com/premium-data
Headers: {
  Accept: "application/json",
  X-Payment: "eyJ4NDAyVmVyc2lvbiI6MSw..." // Base64 encoded payment
}
```

The client retries with the `X-Payment` header containing the base64-encoded payment proof.

### 6. Server Verification

The server verifies:

1. **Payment format** - Valid x402 payload structure
2. **Signature** - Cryptographically valid
3. **Amount** - Matches required amount
4. **Network** - Correct blockchain network
5. **Mint/Asset** - Correct token (USDC)
6. **Timestamp** - Recent (prevents replay attacks)
7. **Duplicate** - Not used before

### 7. Success Response

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    // Your protected data here
  },
  "payment": {
    "amount": "0.01",
    "currency": "USDC",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

The API returns the requested data along with payment confirmation.

## x402 Pocket Nodes Architecture

### Three-Node System

```
┌──────────────────────┐
│  x402 Wallet Manager │
│  - Generate wallet   │
│  - Check balances    │
│  - Fund instructions │
└──────────┬───────────┘
           │ Provides wallet data
           ↓
┌──────────────────────┐
│    x402 Client       │
│  - Makes requests    │
│  - Handles 402       │
│  - Creates payments  │
│  - Signs with wallet │
└──────────┬───────────┘
           │ Calls API
           ↓
┌──────────────────────┐
│   x402 Mock Server   │
│  - Simulates 402     │
│  - Verifies payment  │
│  - Returns data      │
└──────────────────────┘
```

### Wallet Management

**Persistent Storage**:

- Wallets stored in n8n's workflow static data
- One wallet per network (devnet/mainnet)
- Reused across all workflow executions

**Multiple Options**:

1. **Saved Wallet** - Connected once, then automatic
2. **Private Key** - Manual entry, reusable
3. **From Wallet Manager** - Live connection
4. **Auto-Generate** - Per-node generation (not recommended)

### Payment Security

**Signature Verification**:

```typescript
// Message to sign
{
  from: "wallet_address",
  amount: "10000",
  mint: "usdc_mint_address",
  timestamp: 1699999999
}

// Signed with wallet's private key
signature = sign(message, privateKey)
```

**Replay Protection**:

- Each payment has a timestamp
- Servers track used signatures
- Old payments automatically rejected

**Amount Verification**:

- Exact match required
- Cannot underpay
- Cannot reuse same payment for different amounts

## Payment Schemes

### Exact Scheme (Current)

The "exact" scheme requires exact payment amounts:

```json
{
  "scheme": "exact",
  "maxAmountRequired": "10000"
}
```

- Client must pay exactly 0.01 USDC
- No partial payments
- No overpayment credit

### Future Schemes

The x402 protocol supports future schemes:

- **Range**: Min/max payment amounts
- **Subscription**: Time-based access
- **Invoice**: Pay multiple items at once
- **Hashlock**: Conditional payments

x402 Pocket Nodes currently implements the "exact" scheme.

## Blockchain Settlement

### Payment Proof vs. On-Chain Settlement

**Payment Proof (Default)**:

- Client signs a message proving wallet ownership
- Server verifies signature format
- No actual blockchain transaction yet
- Fast and efficient for testing

**On-Chain Settlement (Optional)**:

- Actual USDC transfer on Solana
- Server receives real funds
- Verifiable on blockchain explorer
- Required for production

### When to Use Each

**Use Payment Proof for**:

- Development and testing
- Learning the protocol
- Rapid iteration
- Mock servers

**Use On-Chain Settlement for**:

- Production deployments
- Real money transfers
- Regulatory compliance
- Audit trails

## Error Handling

### Common Errors

**Insufficient Balance**:

```json
{
  "error": "Insufficient balance",
  "required": "0.01 USDC",
  "available": "0.005 USDC"
}
```

**Payment Too Low**:

```json
{
  "error": "Amount mismatch",
  "required": "10000",
  "provided": "5000"
}
```

**Expired Payment**:

```json
{
  "error": "Payment timestamp too old",
  "maxAge": "300 seconds",
  "age": "450 seconds"
}
```

**Duplicate Payment**:

```json
{
  "error": "Payment already processed",
  "signature": "5YGc9L..."
}
```

The x402 Client node handles these automatically and provides clear error messages in n8n.

## Benefits of x402

### For API Providers

- **Micropayment revenue** - Charge per request
- **No subscriptions** - Simpler billing
- **Less fraud** - Crypto payments are irreversible
- **Global access** - Anyone with a wallet can pay

### For API Consumers

- **Pay-as-you-go** - Only pay for what you use
- **No accounts** - Just need a crypto wallet
- **Transparent pricing** - See cost before making request
- **Automated payments** - x402 Client handles everything

### For n8n Users

- **Workflow automation** - Integrate paid APIs easily
- **Budget control** - Set spending limits
- **No manual payments** - Everything automatic
- **Testing support** - Mock server for development

## What's Next?

- [Payment Flow](/concepts/payment-flow/) - Detailed payment process
- [Mock Server](/concepts/mock-server/) - Testing without real money
- [Security](/advanced/security/) - How payments are secured
- [Basic Payment Example](/examples/basic-payment/) - Try it yourself
