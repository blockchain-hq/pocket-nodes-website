---
title: Payment Flow
description: Detailed walkthrough of the x402 payment process in n8n
---

This guide provides a detailed walkthrough of what happens when your n8n workflow makes a payment-protected API request using x402 Pocket Nodes.

## Complete Flow Diagram

```
┌─────────────┐
│  Workflow   │
│  Trigger    │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│ x402 Wallet Manager  │
│ - Loads wallet       │
│ - Checks balance     │
└──────┬───────────────┘
       │ Wallet data (privateKey, address, balance)
       ↓
┌──────────────────────┐
│   x402 Client        │
│ 1. Initial Request   │
└──────┬───────────────┘
       │ GET /api/data
       ↓
┌──────────────────────┐
│   API Server         │
│ "Payment required"   │
└──────┬───────────────┘
       │ 402 Response
       ↓
┌──────────────────────┐
│   x402 Client        │
│ 2. Parse 402         │
│ 3. Check limits      │
│ 4. Create payment    │
│ 5. Sign with wallet  │
└──────┬───────────────┘
       │ GET /api/data
       │ + X-Payment header
       ↓
┌──────────────────────┐
│   API Server         │
│ 6. Verify payment    │
│ 7. Return data       │
└──────┬───────────────┘
       │ 200 OK + data
       ↓
┌──────────────────────┐
│   x402 Client        │
│ 8. Return to n8n     │
└──────┬───────────────┘
       │ Response with payment info
       ↓
┌──────────────────────┐
│  Next Node           │
│  {{$json}}           │
└──────────────────────┘
```

## Step-by-Step Breakdown

### Step 1: Workflow Execution Starts

Your workflow is triggered (manually, scheduled, webhook, etc.):

```json
// Input from trigger
{
  "triggerTime": "2024-01-15T10:30:00Z"
}
```

### Step 2: Wallet Manager Provides Wallet

The x402 Wallet Manager node provides wallet information:

```json
{
  "walletAddress": "9rKnvE7PVbpq4Ws...",
  "privateKey": "[1,2,3,...]",
  "network": "solana-devnet",
  "balances": {
    "usdc": 10.5,
    "sol": 1.2
  },
  "ready": true
}
```

This data flows to the x402 Client node.

### Step 3: Client Makes Initial Request

The x402 Client sends the HTTP request without payment:

```http
GET /api/premium-data HTTP/1.1
Host: api.example.com
Accept: application/json
```

No `X-Payment` header yet - this is the first attempt.

### Step 4: Server Returns 402 Payment Required

The API server responds with payment requirements:

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "maxAmountRequired": "10000",
      "resource": "/api/premium-data",
      "description": "Premium data access",
      "payTo": "ABC123xyz789...",
      "asset": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      "maxTimeoutSeconds": 300
    }
  ]
}
```

**Payment Requirements Explained**:

- `maxAmountRequired`: "10000" = 0.01 USDC (6 decimals)
- `payTo`: Server's wallet address (recipient)
- `asset`: USDC mint address on Solana
- `network`: Which blockchain to use
- `scheme`: Payment method ("exact" = exact amount)

### Step 5: Client Detects 402 Response

The x402 Client automatically detects the 402 status code:

```typescript
if (response.status === 402) {
  console.log("Payment required!");
  const requirements = response.data;
  // Proceed to create payment
}
```

### Step 6: Client Checks Payment Limits

Before proceeding, the client verifies:

```typescript
const amountInUsdc = "0.01"; // Convert from smallest units
const maxAllowed = "1.00"; // From node configuration

if (parseFloat(amountInUsdc) > parseFloat(maxAllowed)) {
  throw new Error("Payment exceeds limit");
}
```

This prevents accidental overspending.

### Step 7: Client Checks Balance

```typescript
if (walletBalance.usdc < 0.01) {
  throw new Error("Insufficient USDC balance");
}

if (walletBalance.sol < 0.001) {
  throw new Error("Insufficient SOL for fees");
}
```

### Step 8: Client Creates Payment Proof

The client creates a payment message:

```typescript
const timestamp = Math.floor(Date.now() / 1000);

const message = {
  from: "9rKnvE7PVbpq4Ws...",
  amount: "10000",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  timestamp: 1705318200,
};
```

### Step 9: Client Signs the Message

Using the wallet's private key (from Wallet Manager):

```typescript
const messageBytes = encodeMessage(message);
const signatureBytes = sign(messageBytes, privateKey);
const signature = base58Encode(signatureBytes);
```

This proves ownership of the wallet without revealing the private key.

### Step 10: Client Creates Payment Payload

```typescript
const paymentPayload = {
  x402Version: 1,
  scheme: "exact",
  network: "solana-devnet",
  payload: {
    signature: "5YGc9Lcqv3...",
    from: "9rKnvE7PVbpq4Ws...",
    amount: "10000",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    timestamp: 1705318200,
  },
};
```

### Step 11: Client Encodes Payment Header

```typescript
const paymentJson = JSON.stringify(paymentPayload);
const paymentHeader = base64Encode(paymentJson);
// Result: "eyJ4NDAyVmVyc2lvbiI6MSw..."
```

### Step 12: Client Retries Request with Payment

```http
GET /api/premium-data HTTP/1.1
Host: api.example.com
Accept: application/json
X-Payment: eyJ4NDAyVmVyc2lvbiI6MSw...
```

The `X-Payment` header contains the complete payment proof.

### Step 13: Server Decodes Payment Header

```typescript
const paymentHeader = request.headers["x-payment"];
const paymentJson = base64Decode(paymentHeader);
const paymentPayload = JSON.parse(paymentJson);
```

### Step 14: Server Verifies Payment

The server performs multiple checks:

**1. Structure Validation**:

```typescript
if (
  !paymentPayload.x402Version ||
  !paymentPayload.scheme ||
  !paymentPayload.payload
) {
  return error("Invalid payment format");
}
```

**2. Amount Verification**:

```typescript
if (paymentPayload.payload.amount !== "10000") {
  return error("Amount mismatch");
}
```

**3. Network Verification**:

```typescript
if (paymentPayload.network !== "solana-devnet") {
  return error("Network mismatch");
}
```

**4. Mint/Asset Verification**:

```typescript
if (paymentPayload.payload.mint !== USDC_MINT_ADDRESS) {
  return error("Invalid token");
}
```

**5. Timestamp Verification** (Replay Protection):

```typescript
const now = Math.floor(Date.now() / 1000);
const age = now - paymentPayload.payload.timestamp;

if (age > 300) {
  // 5 minutes
  return error("Payment expired");
}
```

**6. Duplicate Check**:

```typescript
if (usedSignatures.has(paymentPayload.payload.signature)) {
  return error("Payment already used");
}
```

**7. Signature Verification**:

```typescript
const message = reconstructMessage(paymentPayload.payload);
const isValid = verifySignature(
  message,
  paymentPayload.payload.signature,
  paymentPayload.payload.from
);

if (!isValid) {
  return error("Invalid signature");
}
```

### Step 15: Server Marks Payment as Used

```typescript
usedSignatures.add(paymentPayload.payload.signature);
processedPayments.set(paymentPayload.payload.signature, {
  amount: "10000",
  from: "9rKnvE7PVbpq4Ws...",
  timestamp: 1705318200,
  resource: "/api/premium-data",
});
```

### Step 16: Server Returns Success

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "premium": "content",
    "value": 123.45
  },
  "payment": {
    "amount": "0.01",
    "currency": "USDC",
    "from": "9rKnvE7PVbpq4Ws...",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Step 17: Client Returns to n8n

The x402 Client node outputs:

```json
{
  "data": {
    "premium": "content",
    "value": 123.45
  },
  "_x402Payment": {
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "ABC123xyz789...",
    "sender": "9rKnvE7PVbpq4Ws...",
    "network": "solana-devnet",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

The `_x402Payment` field contains payment details for logging/auditing.

### Step 18: Next Node Processes Data

The next node in your workflow receives the data:

```javascript
// In your next node's expression
const premiumValue = {{$json["data"]["value"]}};
const paymentAmount = {{$json["_x402Payment"]["amount"]}};
```

## Error Scenarios

### Insufficient Balance

```
[Client] Check balance
    ↓
[Client] USDC: 0.005, Need: 0.01
    ↓
[Client] Throw error: "Insufficient balance"
    ↓
[n8n] Workflow fails with error message
```

### Payment Amount Too High

```
[Client] Parse 402 response
    ↓
[Client] Required: 5.00 USDC
    ↓
[Client] Max configured: 1.00 USDC
    ↓
[Client] Throw error: "Payment exceeds limit"
```

### Expired Payment

```
[Client] Create payment at T=100
    ↓
[Network delay]
    ↓
[Server] Receive payment at T=400
    ↓
[Server] Age = 300 seconds (> 300s limit)
    ↓
[Server] Return error: "Payment expired"
    ↓
[Client] Retry with fresh payment
```

### Duplicate Payment (Replay Attack)

```
[Attacker] Intercepts payment signature
    ↓
[Attacker] Sends request with same signature
    ↓
[Server] Check usedSignatures
    ↓
[Server] Signature already used!
    ↓
[Server] Return error: "Payment already processed"
```

## Performance Considerations

### Typical Timing

- **Parse 402**: < 1ms
- **Create payment**: 5-10ms
- **Sign message**: 10-20ms
- **Encode header**: < 1ms
- **Network roundtrip**: 100-500ms (depends on location)
- **Server verification**: 5-15ms

**Total overhead**: ~150-550ms on top of normal API request time.

### Optimization Tips

1. **Reuse wallets**: Don't regenerate on every request
2. **Batch requests**: If calling same API multiple times
3. **Cache payment proofs**: For identical requests (advanced)
4. **Use saved wallet**: Avoid Wallet Manager connection overhead

## Security Best Practices

1. **Always set payment limits** in x402 Client configuration
2. **Monitor wallet balances** regularly
3. **Use Devnet for testing** before mainnet
4. **Never share private keys** outside of n8n
5. **Audit payment logs** in production
6. **Rotate wallets periodically** for large volumes

## What's Next?

- [Mock Server](/concepts/mock-server/) - Test without real payments
- [Testing Client](/concepts/testing-client/) - Development workflows
- [Basic Payment Example](/examples/basic-payment/) - Try it yourself
- [Error Handling](/examples/error-handling/) - Handle failures
