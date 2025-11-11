---
title: Payment Verification
description: How x402 payments are verified and validated
---

Learn how payment verification works in x402 Pocket Nodes and what checks are performed to ensure payment authenticity.

## Verification Overview

When an x402 Client sends a payment to an API server, the server performs multiple verification steps to ensure the payment is valid, authentic, and not fraudulent.

## Verification Steps

### 1. Header Decoding

**What**: Decode the base64 `X-Payment` header

```typescript
const paymentHeader = request.headers["x-payment"];
const decodedJson = base64Decode(paymentHeader);
const paymentPayload = JSON.parse(decodedJson);
```

**Checks**:

- Header exists
- Valid base64 encoding
- Valid JSON structure

**Failure**: Returns 400 Bad Request

### 2. Structure Validation

**What**: Verify payload has required fields

```typescript
if (
  !paymentPayload.x402Version ||
  !paymentPayload.scheme ||
  !paymentPayload.network ||
  !paymentPayload.payload
) {
  reject("Invalid payment format");
}
```

**Checks**:

- `x402Version` present
- `scheme` present
- `network` present
- `payload` object present

**Failure**: "Invalid payment header format"

### 3. Protocol Version Check

**What**: Ensure compatible protocol version

```typescript
if (paymentPayload.x402Version !== 1) {
  reject("Unsupported protocol version");
}
```

**Checks**:

- Version is 1 (current)

**Failure**: "Unsupported x402 version"

### 4. Scheme Validation

**What**: Verify payment scheme is supported

```typescript
if (paymentPayload.scheme !== "exact") {
  reject("Unsupported payment scheme");
}
```

**Checks**:

- Scheme is "exact"
- Future: May support other schemes

**Failure**: "Unsupported payment scheme"

### 5. Network Verification

**What**: Ensure payment is on correct blockchain

```typescript
if (paymentPayload.network !== serverNetwork) {
  reject("Network mismatch");
}
```

**Checks**:

- Network matches server's configuration
- Prevents devnet payments on mainnet server
- Prevents mainnet payments on devnet server

**Failure**: "Network mismatch"

### 6. Amount Verification

**What**: Verify payment amount matches requirement

```typescript
if (paymentPayload.payload.amount !== requiredAmount) {
  reject("Amount mismatch");
}
```

**Checks**:

- Exact match required
- Cannot underpay
- Cannot overpay (for credit)

**Failure**: "Amount mismatch: expected X, got Y"

### 7. Asset Verification

**What**: Verify correct token is being used

```typescript
if (paymentPayload.payload.mint !== USDC_MINT_ADDRESS) {
  reject("Invalid asset");
}
```

**Checks**:

- Mint address matches USDC
- Correct for the network (devnet vs mainnet)

**Failure**: "Mint address mismatch"

### 8. Timestamp Validation (Replay Protection)

**What**: Ensure payment is recent

```typescript
const now = Math.floor(Date.now() / 1000);
const age = now - paymentPayload.payload.timestamp;

if (age > 300) {
  // 5 minutes
  reject("Payment too old");
}
```

**Checks**:

- Timestamp is within 5 minutes
- Not from the future (with small tolerance)

**Failure**: "Payment timestamp too old: X seconds"

### 9. Signature Format Validation

**What**: Verify signature is well-formed

```typescript
const signatureBytes = base58Decode(signature);

if (signatureBytes.length !== 64) {
  reject("Invalid signature");
}
```

**Checks**:

- Valid base58 encoding
- Exactly 64 bytes
- Proper format

**Failure**: "Invalid signature format" or "Invalid signature encoding"

### 10. Duplicate Detection

**What**: Prevent payment reuse (replay attack)

```typescript
const paymentId = `${signature}-${timestamp}`;

if (usedPayments.has(paymentId)) {
  reject("Already used");
}
```

**Checks**:

- Signature hasn't been used before
- Even with different timestamps

**Failure**: "Payment already processed"

### 11. Mark as Used

**What**: Track signature to prevent future reuse

```typescript
usedPayments.add(paymentId);
processedPayments.set(signature, {
  amount,
  from,
  timestamp,
  resource,
});
```

**Purpose**: Replay protection

## Verification Modes

### Off-Chain (Default)

**What it verifies**:

- All structure and format checks
- All security checks (timestamp, duplicate)
- Signature format (not cryptographic validity)

**What it doesn't verify**:

- Actual blockchain transaction
- Real fund transfer
- On-chain state

**Use for**:

- Development and testing
- Mock servers
- High-performance scenarios
- When trust model allows

**Advantages**:

- Instant verification (~5-15ms)
- No blockchain interaction needed
- No network latency
- Works offline

### On-Chain (Optional)

**What it verifies**:

- Everything from off-chain mode
- PLUS: Actual blockchain transaction
- PLUS: Real fund transfer occurred
- PLUS: Sufficient balance in sender wallet

**What it requires**:

- Server wallet funded with SOL (for receiving)
- Actual USDC transfer transaction
- Blockchain confirmation wait (~5-10 seconds)

**Use for**:

- Production environments
- Real money transfers
- Regulatory compliance
- Audit trails

**Advantages**:

- Cryptographic proof of payment
- Immutable blockchain record
- Server actually receives funds
- No trust required

## Security Guarantees

### What Payment Verification Guarantees

✅ **Authentic**: Payment came from wallet owner (signature proof)

✅ **Exact**: Payment is for the exact amount required

✅ **Fresh**: Payment was created recently (< 5 minutes)

✅ **Unique**: Payment hasn't been used before

✅ **Correct Network**: Payment is on the right blockchain

✅ **Correct Asset**: Payment uses USDC (not other tokens)

### What It Doesn't Guarantee (Off-Chain)

❌ **Funds Available**: Wallet might be empty

❌ **Transaction Executed**: No blockchain transaction sent

❌ **Server Received Funds**: No actual transfer occurred

❌ **Non-Repudiation**: No on-chain proof

For these guarantees, use on-chain verification.

## Error Scenarios

### Invalid Structure

```json
{
  "error": "Invalid payment header format",
  "statusCode": 400
}
```

**Cause**: Malformed payload, missing fields

### Amount Mismatch

```json
{
  "error": "Amount mismatch: expected 10000, got 5000",
  "statusCode": 400
}
```

**Cause**: Client paid wrong amount

### Expired Payment

```json
{
  "error": "Payment timestamp too old: 450 seconds",
  "statusCode": 400
}
```

**Cause**: Payment created > 5 minutes ago

### Duplicate Payment

```json
{
  "error": "Payment already processed",
  "statusCode": 400
}
```

**Cause**: Same signature used twice (replay attack)

### Network Mismatch

```json
{
  "error": "Network mismatch",
  "statusCode": 400
}
```

**Cause**: Payment on different network than server

## Implementing Your Own Server

If you're building an x402-enabled API:

### Basic Server Structure

```javascript
// Express.js example
app.get(
  "/api/premium-data",
  requirePayment({ amount: "10000" }),
  (req, res) => {
    res.json({ data: "protected content" });
  }
);
```

### Payment Middleware

```javascript
function requirePayment(options) {
  return async (req, res, next) => {
    const paymentHeader = req.headers["x-payment"];

    if (!paymentHeader) {
      return res.status(402).json({
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "solana-devnet",
            maxAmountRequired: options.amount,
            payTo: SERVER_WALLET,
            asset: USDC_MINT,
          },
        ],
      });
    }

    const verification = await verifyPayment(paymentHeader, options);

    if (!verification.isValid) {
      return res.status(400).json({ error: verification.error });
    }

    req.payment = verification.payment;
    next();
  };
}
```

See the [showcase server](https://github.com/blockchain-hq/x402-pocket-nodes/tree/main/showcase-server) for a complete implementation.

## Mock Server Verification

The x402 Mock Server node performs the same verification:

### Configuration

- **Verify On-Chain**: `false` (off-chain, signature format only)
- **Verify On-Chain**: `true` (on-chain, full settlement)

### Off-Chain Verification

```
1. Decode X-Payment header ✓
2. Validate structure ✓
3. Check amount ✓
4. Check network ✓
5. Check asset (USDC) ✓
6. Check timestamp ✓
7. Check signature format ✓
8. Check not duplicate ✓
9. Return mock response
```

### On-Chain Verification

```
1-8. All off-chain checks ✓
9. Submit transaction to Solana ✓
10. Wait for confirmation ✓
11. Verify transaction details ✓
12. Verify fund transfer ✓
13. Return mock response
```

## Verification Performance

### Off-Chain

- **Latency**: 5-15ms
- **Throughput**: 1000+ requests/second
- **Scalability**: Easily horizontal
- **Cost**: Free (no blockchain calls)

### On-Chain

- **Latency**: 5-10 seconds
- **Throughput**: ~10-20 requests/second (blockchain limited)
- **Scalability**: Blockchain dependent
- **Cost**: SOL for transaction fees

## What's Next?

- [Payment Concepts](/api/payment/) - Understanding payments
- [Client Node](/api/client/) - Client configuration
- [Mock Server](/concepts/mock-server/) - Test verification
- [Security](/advanced/replay-protection/) - Advanced security
