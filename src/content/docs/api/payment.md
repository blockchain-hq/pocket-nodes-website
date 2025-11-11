---
title: Payment Concepts
description: Understanding x402 payments in n8n workflows
---

Learn about x402 payment concepts and how they work within your n8n workflows.

## What is an x402 Payment?

An x402 payment is a cryptographically signed proof that demonstrates:

- The payer's wallet address
- The exact amount being paid
- The token/asset used (USDC)
- When the payment was created
- That the payer owns the wallet (via signature)

## Payment Structure

### Payment Payload

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "solana-devnet",
  "payload": {
    "signature": "5YGc9Lcqv3Nvx...",
    "from": "9rKnvE7PVbpq4Ws...",
    "amount": "10000",
    "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    "timestamp": 1705318200
  }
}
```

### Field Explanations

**x402Version**: Protocol version (always 1)

**scheme**: Payment method

- `exact` = Pay exact amount specified
- Future: `range`, `subscription`, etc.

**network**: Blockchain network

- `solana-devnet` = Solana Devnet (testing)
- `solana-mainnet` = Solana Mainnet (production)

**payload.signature**: Cryptographic signature

- Base58 encoded
- 64 bytes
- Proves wallet ownership
- Created by signing message with private key

**payload.from**: Payer's wallet address

- Public key in base58
- Visible on blockchain
- Used to verify signature

**payload.amount**: Payment amount in smallest units

- `10000` = 0.01 USDC (6 decimals)
- `100000` = 0.10 USDC
- `1000000` = 1.00 USDC

**payload.mint**: Token/asset address

- USDC mint address on Solana
- Devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

**payload.timestamp**: Unix timestamp

- When payment was created
- Used for replay protection
- Must be recent (< 5 minutes)

## Payment Creation Flow

### 1. Client Receives 402 Response

```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "maxAmountRequired": "10000",
      "payTo": "ABC123...",
      "asset": "4zMMC9srt5...",
      "network": "solana-devnet"
    }
  ]
}
```

### 2. Client Extracts Requirements

```typescript
const requirements = response.accepts[0];
const amount = requirements.maxAmountRequired; // "10000"
const recipient = requirements.payTo; // "ABC123..."
const mint = requirements.asset; // "4zMMC9srt5..."
const network = requirements.network; // "solana-devnet"
```

### 3. Client Creates Message

```typescript
const timestamp = Math.floor(Date.now() / 1000);

const message = {
  from: walletAddress, // "9rKnvE7..."
  amount: amount, // "10000"
  mint: mint, // "4zMMC9srt5..."
  timestamp: timestamp, // 1705318200
};
```

### 4. Client Signs Message

```typescript
const messageJson = JSON.stringify(message);
const messageBytes = encode(messageJson);
const signatureBytes = sign(messageBytes, privateKey);
const signature = base58Encode(signatureBytes);
```

### 5. Client Creates Payload

```typescript
const payload = {
  x402Version: 1,
  scheme: "exact",
  network: network,
  payload: {
    signature: signature,
    ...message,
  },
};
```

### 6. Client Encodes Header

```typescript
const json = JSON.stringify(payload);
const base64 = btoa(json);
// Result: "eyJ4NDAyVmVyc2lvbiI6MSw..."
```

### 7. Client Sends Request

```http
GET /api/premium-data HTTP/1.1
Host: api.example.com
X-Payment: eyJ4NDAyVmVyc2lvbiI6MSw...
```

All of this happens automatically in the x402 Client node!

## Payment Verification

### What Servers Verify

1. **Payload Structure**: Valid JSON with required fields
2. **Protocol Version**: Must be version 1
3. **Scheme**: Must be "exact" (currently)
4. **Network**: Must match server's network
5. **Amount**: Must match exactly
6. **Mint/Asset**: Must be USDC
7. **Timestamp**: Must be recent (< 5 minutes)
8. **Signature**: Must be valid for the message and wallet
9. **Duplicate**: Must not have been used before

### Verification Process

```
1. Decode base64 header
   ↓
2. Parse JSON
   ↓
3. Check structure
   ↓
4. Verify amount matches
   ↓
5. Verify network matches
   ↓
6. Verify asset is USDC
   ↓
7. Check timestamp age
   ↓
8. Verify signature format
   ↓
9. Check not duplicate
   ↓
10. Accept or reject
```

## Amount Conversion

### Smallest Units to USDC

USDC has 6 decimal places:

```
Smallest Units → USDC
10000         → 0.01
100000        → 0.10
1000000       → 1.00
10000000      → 10.00
```

### Conversion Formula

```typescript
// Smallest units to USDC
const usdc = smallestUnits / 1_000_000;

// USDC to smallest units
const smallestUnits = usdc * 1_000_000;
```

### Examples

```
0.01 USDC = 10,000 smallest units
0.05 USDC = 50,000 smallest units
0.10 USDC = 100,000 smallest units
1.00 USDC = 1,000,000 smallest units
```

The x402 Client handles this conversion automatically.

## Security Features

### Signature Verification

Signatures prove wallet ownership without revealing private keys:

```
Private Key (secret)
    → Signs message
    → Produces signature (public)

Server verifies:
    Message + Signature + Public Key = Valid? ✓
```

### Replay Protection

Prevents reusing the same payment:

**Timestamp Check**:

- Payments older than 5 minutes are rejected
- Prevents old payments from being replayed

**Signature Tracking**:

- Servers track used signatures
- Duplicate signatures are rejected
- Even within the time window

### Amount Protection

**Exact Match Required**:

- Cannot pay less than required
- Cannot pay more and get credit
- Must pay exactly the specified amount

**Client-Side Limit**:

- Max payment amount configured in node
- Prevents accidental overspending
- Workflow fails instead of overpaying

### Network Isolation

**Devnet vs Mainnet**:

- Payments on devnet don't work on mainnet
- Prevents accidental real money in testing
- Wallets are network-specific

## Payment Schemes

### Exact Scheme (Current)

The only currently implemented scheme:

```json
{
  "scheme": "exact",
  "maxAmountRequired": "10000"
}
```

**Characteristics**:

- Pay exactly the specified amount
- No partial payments
- No overpayment credit
- Simple and predictable

### Future Schemes

The x402 protocol supports future extensions:

**Range Scheme**:

```json
{
  "scheme": "range",
  "minAmountRequired": "10000",
  "maxAmountRequired": "50000"
}
```

Pay any amount in range.

**Subscription Scheme**:

```json
{
  "scheme": "subscription",
  "amountRequired": "1000000",
  "validityPeriod": 2592000
}
```

Pay once for time-based access.

**Invoice Scheme**:

```json
{
  "scheme": "invoice",
  "items": [
    { "resource": "/api/a", "amount": "10000" },
    { "resource": "/api/b", "amount": "20000" }
  ]
}
```

Pay for multiple items at once.

## Payment Lifecycle

### 1. Creation

x402 Client creates payment when 402 is received.

**Triggers**: 402 response from API

**Duration**: ~10-20ms

### 2. Transmission

Payment sent in `X-Payment` header.

**Triggers**: Automatic retry by Client

**Duration**: Network latency (~100-500ms)

### 3. Verification

Server verifies payment proof.

**Triggers**: Server receives request with X-Payment

**Duration**: ~5-15ms

### 4. Usage Tracking

Server marks signature as used.

**Triggers**: After successful verification

**Duration**: < 1ms

### 5. Response

Server returns protected data.

**Triggers**: After payment acceptance

**Duration**: Depends on API processing

## Best Practices

### For API Consumers (n8n Users)

1. **Set reasonable limits**: Don't set max too high
2. **Monitor balances**: Check wallet regularly
3. **Use devnet first**: Test before production
4. **Log payments**: Track spending for budgeting
5. **Handle errors**: Implement error handling

### For API Providers

1. **Clear pricing**: Document exact costs
2. **Stable prices**: Don't change frequently
3. **Fast verification**: Keep latency low
4. **Good errors**: Clear rejection reasons
5. **Track payments**: Audit trail for compliance

## Payment Metadata

### What Gets Logged

The Client node includes payment metadata in output:

```json
{
  "_x402Payment": {
    "amount": "0.01", // For logging
    "currency": "USDC", // For display
    "recipient": "ABC123...", // Where it went
    "sender": "9rKnvE7...", // Who paid
    "network": "solana-devnet", // Which blockchain
    "timestamp": "2024-01-15T10:30:00.000Z" // When
  }
}
```

### Recommended Logging

Log to database or file:

```javascript
// In Code node after Client
const log = {
  workflow: $workflow.name,
  execution: $execution.id,
  timestamp: new Date().toISOString(),
  apiUrl: "{{$node['x402 Client'].parameter.resourceUrl}}",
  paymentAmount: $json._x402Payment?.amount || "0",
  success: $json._x402Payment !== undefined,
};

// Send to logging service
return { json: log };
```

## Cost Calculation

### Per-Request Costs

```
API Call Cost: 0.01 USDC
Blockchain Fee: ~0.000005 SOL (~$0.0005)
Total: ~$0.01 + $0.0005 = ~$0.0105
```

### Monthly Estimates

```
1 call/hour = 720 calls/month = ~$7.20
1 call/day = 30 calls/month = ~$0.30
1 call/week = 4 calls/month = ~$0.04
```

### Budget Planning

Calculate expected costs:

```typescript
const callsPerDay = 24; // Hourly workflow
const costPerCall = 0.01; // 0.01 USDC per call
const daysPerMonth = 30;

const monthlyCost = callsPerDay * costPerCall * daysPerMonth;
// Result: $7.20/month

const recommendedBalance = monthlyCost * 1.2; // 20% buffer
// Fund wallet with: $8.64
```

## What's Next?

- [Client Node Reference](/api/client/) - Full configuration
- [Wallet Manager](/api/wallets/) - Manage wallets
- [Verification](/api/verification/) - How verification works
- [Examples](/examples/basic-payment/) - Try it yourself
