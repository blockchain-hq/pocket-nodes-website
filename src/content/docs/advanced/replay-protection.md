---
title: Replay Protection
description: Understanding and implementing replay attack protection
---


x402test includes built-in protection against replay attacks.

## What Are Replay Attacks?

A replay attack occurs when an attacker intercepts a valid payment signature and attempts to reuse it to access the same resource multiple times without paying again.

## How x402test Prevents Replay Attacks

### Signature Tracking

Every used transaction signature is recorded:

```json
// .x402test-signatures.json
[
  {
    "signature": "5XzT4qW3...",
    "usedAt": 1699564800000,
    "endpoint": "/api/premium",
    "amount": "100000"
  }
]
```

### Verification Process

When a payment is received:

1. **Check Signature**: Look up signature in used signatures
2. **If Found**: Reject with "Payment already processed"
3. **If New**: Verify transaction on blockchain
4. **If Valid**: Mark signature as used and return content

## API Functions

### isSignatureUsed()

Check if a signature has been used.

```typescript
import { isSignatureUsed } from "x402test";

if (isSignatureUsed(signature)) {
  console.log("Signature already used");
}
```

### markSignatureUsed()

Mark a signature as used.

```typescript
import { markSignatureUsed } from "x402test";

markSignatureUsed(signature, "/api/endpoint", "10000");
```

### getSignatureInfo()

Get information about a used signature.

```typescript
import { getSignatureInfo } from "x402test";

const info = getSignatureInfo(signature);
if (info) {
  console.log("Used at:", new Date(info.usedAt));
  console.log("Endpoint:", info.endpoint);
  console.log("Amount:", info.amount);
}
```

### getSignatureStats()

Get statistics about all signatures.

```typescript
import { getSignatureStats } from "x402test";

const stats = getSignatureStats();
console.log("Total signatures:", stats.total);
console.log("All signatures:", stats.signatures);
```

### resetSignatures()

Clear all signature records (for testing).

```typescript
import { resetSignatures } from "x402test";

resetSignatures();
console.log("All signatures cleared");
```

## Example: Replay Attack Prevention

```typescript
import { x402 } from "x402test";

async function demonstrateReplayProtection() {
  // First request - succeeds
  const response1 = await x402("http://localhost:4402/api/data")
    .withPayment("0.01")
    .execute();

  console.log("First request succeeded");
  console.log("Signature:", response1.payment?.signature);

  // Try to reuse the same payment
  try {
    // Manually construct request with same payment
    const { createXPaymentHeader, parse402Response } = await import("x402test");

    const initialResponse = await fetch("http://localhost:4402/api/data");
    const requirements = parse402Response(await initialResponse.json());

    const paymentHeader = createXPaymentHeader(
      response1.payment!.signature,
      requirements,
      response1.payment!.from
    );

    const replayResponse = await fetch("http://localhost:4402/api/data", {
      headers: { "X-PAYMENT": paymentHeader },
    });

    if (replayResponse.status === 402) {
      const body = await replayResponse.json();
      console.log("✔ Replay attack prevented!");
      console.log("  Error:", body.error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
```

## Custom Implementation

### Server-Side

```typescript
import { verifyPayment, isSignatureUsed, markSignatureUsed } from "x402test";

async function handlePayment(signature: string, endpoint: string) {
  // Check replay
  if (isSignatureUsed(signature)) {
    return {
      status: 402,
      error: "Payment already processed",
    };
  }

  // Verify on blockchain
  const result = await verifyPayment(signature, recipient, amount, mint);

  if (!result.isValid) {
    return {
      status: 402,
      error: result.invalidReason,
    };
  }

  // Mark as used
  markSignatureUsed(signature, endpoint, amount.toString());

  return {
    status: 200,
    data: "Protected content",
  };
}
```

### Client-Side

The x402 client automatically creates new payments for each request:

```typescript
// Each request creates a NEW payment
await x402(url).withPayment("0.01").execute(); // Payment 1
await x402(url).withPayment("0.01").execute(); // Payment 2 (different signature)
```

## Signature Storage

### File Storage

Signatures are stored in `.x402test-signatures.json`:

```json
[
  {
    "signature": "5XzT4qW3Hk2p7vN...",
    "usedAt": 1699564800000,
    "endpoint": "/api/premium",
    "amount": "100000"
  },
  {
    "signature": "3AbC8dEf9Gh1Jk2...",
    "usedAt": 1699564900000,
    "endpoint": "/api/data",
    "amount": "10000"
  }
]
```

**Important:** Add to `.gitignore`:

```
.x402test-signatures.json
```

### In-Memory Storage

For production, consider using a database:

```typescript
class SignatureStore {
  private signatures = new Map<string, SignatureRecord>();

  isUsed(signature: string): boolean {
    return this.signatures.has(signature);
  }

  markUsed(signature: string, endpoint: string, amount: string) {
    this.signatures.set(signature, {
      signature,
      usedAt: Date.now(),
      endpoint,
      amount,
    });
  }

  getInfo(signature: string): SignatureRecord | undefined {
    return this.signatures.get(signature);
  }
}
```

### Database Storage

```typescript
import { prisma } from "./db";

async function isSignatureUsed(signature: string): Promise<boolean> {
  const record = await prisma.usedSignature.findUnique({
    where: { signature },
  });
  return record !== null;
}

async function markSignatureUsed(
  signature: string,
  endpoint: string,
  amount: string
) {
  await prisma.usedSignature.create({
    data: {
      signature,
      endpoint,
      amount,
      usedAt: new Date(),
    },
  });
}
```

## Security Considerations

### Signature Expiration

Implement time-based expiration:

```typescript
function isSignatureExpired(
  usedAt: number,
  maxAge: number = 86400000
): boolean {
  return Date.now() - usedAt > maxAge; // Default: 24 hours
}

// Clean up old signatures
function cleanupExpiredSignatures() {
  const stats = getSignatureStats();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  const validSignatures = stats.signatures.filter(
    (sig) => !isSignatureExpired(sig.usedAt, maxAge)
  );

  // Save only valid signatures
  // Implementation depends on storage method
}
```

### Distributed Systems

For multiple servers, use shared storage:

1. **Redis**: Fast, distributed cache
2. **Database**: Persistent storage
3. **Message Queue**: Synchronize across servers

## Best Practices

1. **Always Check**: Never skip replay protection
2. **Use Timestamps**: Track when signatures were used
3. **Cleanup Old**: Remove expired signatures
4. **Log Attempts**: Log replay attack attempts
5. **Secure Storage**: Protect signature database

## Next Steps

- [Custom Validation](/advanced/custom-validation) - Advanced validation
- [Verification](/api/verification) - Payment verification API
