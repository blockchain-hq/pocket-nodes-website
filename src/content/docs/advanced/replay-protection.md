---
title: Replay Protection
description: How x402 prevents payment replay attacks
---

Learn how x402 Pocket Nodes protects against replay attacks where attackers try to reuse payment proofs to gain unauthorized access.

## What is a Replay Attack?

A replay attack occurs when an attacker:

1. Intercepts a valid payment proof
2. Captures the `X-Payment` header
3. Attempts to reuse it for another request
4. Tries to get free access using someone else's payment

Without protection, this would allow:

- Unlimited API access with one payment
- Stolen payment proofs giving free access
- Compromised security of payment system

## How x402 Prevents Replay Attacks

### 1. Timestamp Validation

Every payment includes a timestamp:

```json
{
  "payload": {
    "timestamp": 1705318200
  }
}
```

**Server checks**:

```typescript
const now = Math.floor(Date.now() / 1000);
const age = now - payment.timestamp;

if (age > 300) {
  // 5 minutes
  reject("Payment expired");
}
```

**Protection**:

- Old payments automatically rejected
- Attack window limited to 5 minutes
- Reduces replay attack viability

### 2. Signature Tracking

Servers track used payment signatures:

```typescript
// In-memory set (or database in production)
const usedSignatures = new Set();

// On payment verification
if (usedSignatures.has(payment.signature)) {
  reject("Payment already used");
}

// After successful verification
usedSignatures.add(payment.signature);
```

**Protection**:

- Each signature can only be used once
- Even within the 5-minute window
- Duplicate attempts are rejected

### 3. Combined Protection

Both mechanisms work together:

```
Payment created at T=0
    ↓
Used at T=60 (1 minute) ✓
    ↓
Signature marked as used
    ↓
Attempt to reuse at T=120 (2 minutes)
    ├─ Timestamp check: ✓ (< 5 min)
    └─ Signature check: ✗ (already used)
         ↓
    Rejected!
```

## Implementation in Nodes

### Client Node

The x402 Client automatically:

- Generates fresh timestamp for each payment
- Creates unique signature for each payment
- Never reuses payment proofs

**Every request gets a new payment**:

```
Request 1 → Payment A (timestamp: T1, signature: S1)
Request 2 → Payment B (timestamp: T2, signature: S2)
Request 3 → Payment C (timestamp: T3, signature: S3)
```

### Mock Server Node

The x402 Mock Server automatically:

- Checks payment timestamps
- Tracks used signatures
- Rejects duplicates

**Storage**: Node-level static data

```typescript
const staticData = this.getWorkflowStaticData("node");
const usedSignatures = staticData.usedSignatures || new Set();
```

## Attack Scenarios

### Scenario 1: Immediate Replay

**Attack**:

```
1. Attacker captures X-Payment header
2. Immediately reuses it
```

**Defense**:

```
Server checks usedSignatures
→ Signature already used
→ Reject: "Payment already processed"
```

**Result**: ✅ Blocked

### Scenario 2: Delayed Replay

**Attack**:

```
1. Attacker captures X-Payment header at T=0
2. Waits 10 minutes
3. Tries to use it at T=600
```

**Defense**:

```
Server checks timestamp
→ Age: 600 seconds (> 300 max)
→ Reject: "Payment expired"
```

**Result**: ✅ Blocked

### Scenario 3: Modified Replay

**Attack**:

```
1. Attacker captures X-Payment header
2. Modifies amount or recipient
3. Reuses with modifications
```

**Defense**:

```
Server verifies signature
→ Message doesn't match signature
→ Signature invalid for modified data
→ Reject: "Invalid signature"
```

**Result**: ✅ Blocked (signature wouldn't verify)

### Scenario 4: Cross-Endpoint Replay

**Attack**:

```
1. Attacker pays for /api/cheap (0.01 USDC)
2. Captures payment
3. Tries to use for /api/expensive (1.00 USDC)
```

**Defense**:

```
Server checks amount in signature
→ Amount: 0.01 USDC
→ Required: 1.00 USDC
→ Reject: "Amount mismatch"
```

**Result**: ✅ Blocked

## Production Considerations

### Signature Storage

**In-Memory (Development)**:

```typescript
const usedSignatures = new Set();
```

**Pros**:

- Fast
- Simple

**Cons**:

- Lost on restart
- Doesn't scale across instances

**Redis (Production)**:

```typescript
// Pseudocode
const redis = new Redis();

async function isSignatureUsed(sig) {
  return await redis.exists(`sig:${sig}`);
}

async function markSignatureUsed(sig) {
  // Expire after 5 minutes (payment timeout)
  await redis.setex(`sig:${sig}`, 300, "1");
}
```

**Pros**:

- Persists across restarts
- Shared across instances
- Automatic expiry

**Cons**:

- Requires Redis
- Network overhead

**Database (Audit Trail)**:

```typescript
await db.payments.insert({
  signature: payment.signature,
  from: payment.from,
  amount: payment.amount,
  timestamp: payment.timestamp,
  resource: request.path,
  usedAt: new Date(),
});
```

**Pros**:

- Permanent audit trail
- Full payment history
- Analytics possible

**Cons**:

- Slower than Redis
- Storage grows over time

### Cleanup Strategies

**Time-Based Cleanup**:

```javascript
// Remove signatures older than 5 minutes
setInterval(() => {
  const now = Date.now() / 1000;
  for (const [sig, data] of processedPayments) {
    if (now - data.timestamp > 300) {
      processedPayments.delete(sig);
    }
  }
}, 60000); // Every minute
```

**Size-Based Cleanup**:

```javascript
// Keep only last N signatures
const MAX_SIGNATURES = 10000;

if (usedSignatures.size > MAX_SIGNATURES) {
  // Remove oldest signatures (requires ordered storage)
  const sorted = [...usedSignatures].sort();
  const toRemove = sorted.slice(0, 1000);
  toRemove.forEach((sig) => usedSignatures.delete(sig));
}
```

## Multi-Instance Deployment

### Challenge

When running multiple server instances:

```
Instance A knows about payments it processed
Instance B doesn't know about Instance A's payments
→ Duplicate payment could work on Instance B
```

### Solution: Shared Storage

Use Redis or database for signature tracking:

```
Client → Load Balancer
             ├→ Instance A → Redis (check/store signatures)
             ├→ Instance B → Redis (check/store signatures)
             └→ Instance C → Redis (check/store signatures)
```

All instances check the same signature store.

## Mock Server Replay Protection

### How It Works

The x402 Mock Server uses node-level static data:

```typescript
const staticData = this.getWorkflowStaticData("node");

// Track signatures
if (!staticData.usedSignatures) {
  staticData.usedSignatures = {};
}

const signatureKey = `${signature}-${timestamp}`;

if (staticData.usedSignatures[signatureKey]) {
  reject("Payment already processed");
}

staticData.usedSignatures[signatureKey] = {
  usedAt: new Date().toISOString(),
  from: payment.from,
  amount: payment.amount,
};
```

### Persistence

Signatures persist across:

- ✅ Workflow executions
- ✅ n8n restarts
- ✅ Workflow edits

Lost on:

- ❌ Workflow deletion
- ❌ Manual static data clear

### Testing Replay Attacks

Try to reuse a payment:

```
1. Make successful payment
2. Copy X-Payment header value
3. Make manual HTTP request with same header
4. Should get: "Payment already processed"
```

## Best Practices

### 1. Always Track Signatures

Even for testing:

- Builds good habits
- Reveals replay vulnerabilities
- Tests real-world scenarios

### 2. Use Appropriate TTL

**5 minutes** is good because:

- Enough time for network delays
- Short enough to limit replay window
- Standard in x402 protocol

### 3. Log Replay Attempts

When duplicate detected:

```javascript
console.warn("Replay attack detected:", {
  signature: payment.signature,
  originalTimestamp: storedData.timestamp,
  attemptTimestamp: payment.timestamp,
  from: payment.from,
});

// Alert security team if threshold exceeded
```

### 4. Monitor for Patterns

Watch for:

- Multiple replay attempts from same wallet
- Systematic replay testing
- Coordinated attacks

### 5. Include in Tests

Test replay protection:

```javascript
// First request - should succeed
const response1 = await client.makePayment();

// Second request with same payment - should fail
const response2 = await client.reusePayment();
expect(response2.error).toContain("already processed");
```

## Troubleshooting

### False Positives

**Problem**: Legitimate request rejected as duplicate

**Causes**:

- Client retry with same payment
- Network issue caused duplicate send
- Timestamp collision (very rare)

**Solutions**:

- Client creates new payment on retry
- Use signature + timestamp as key
- Log all rejections for analysis

### Signature Storage Growing

**Problem**: usedSignatures keeps growing

**Solutions**:

- Implement time-based cleanup
- Use Redis with TTL
- Store only recent signatures (last hour)

### Cross-Instance Issues

**Problem**: Duplicate works on different instance

**Solution**:

- Use shared storage (Redis/Database)
- All instances check same signature store
- Synchronize via distributed cache

## What's Next?

- [Custom Validation](/advanced/custom-validation/) - Add custom checks
- [Configuration](/advanced/configuration/) - Advanced setup
- [Mock Server](/concepts/mock-server/) - Test replay protection
- [Security](https://github.com/blockchain-hq/x402-pocket-nodes/tree/main/showcase-server) - Showcase server implementation
