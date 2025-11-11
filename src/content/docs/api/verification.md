---
title: Verification
description: API reference for payment verification
---


API reference for verifying payments on the Solana blockchain.

## verifyPayment()

Verifies a payment transaction on-chain.

```typescript
import { verifyPayment, getUsdcMint } from "x402test";
import { PublicKey } from "@solana/web3.js";

const result = await verifyPayment(
  signature,
  new PublicKey(recipientAddress),
  BigInt(expectedAmount),
  getUsdcMint()
);

if (result.isValid) {
  console.log("Payment verified!");
} else {
  console.error("Verification failed:", result.invalidReason);
}
```

**Parameters:**

- `signature` (string): Transaction signature to verify
- `expectedRecipient` (PublicKey): Expected recipient address
- `expectedAmount` (bigint): Expected amount in atomic units
- `expectedMint` (PublicKey): Expected token mint (USDC)

**Returns:** `Promise<VerificationResult>`

## VerificationResult

```typescript
interface VerificationResult {
  isValid: boolean;
  invalidReason: string | null;
  txHash?: string;
  amount?: string;
  from?: string;
  to?: string;
}
```

**Properties:**

- `isValid` (boolean): Whether verification succeeded
- `invalidReason` (string | null): Reason for failure (if any)
- `txHash` (string, optional): Transaction hash
- `amount` (string, optional): Amount transferred
- `from` (string, optional): Sender address
- `to` (string, optional): Recipient address

## Verification Checks

The verification process performs these checks:

### 1. Replay Protection

```typescript
if (isSignatureUsed(signature)) {
  return {
    isValid: false,
    invalidReason: "Payment already processed",
  };
}
```

### 2. Transaction Existence

```typescript
const tx = await connection.getTransaction(signature);
if (!tx) {
  return {
    isValid: false,
    invalidReason: "Transaction not found",
  };
}
```

### 3. Transaction Success

```typescript
if (tx.meta?.err) {
  return {
    isValid: false,
    invalidReason: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
  };
}
```

### 4. Token Transfer

```typescript
const transfer = await findTokenTransfer(tx);
if (!transfer.found) {
  return {
    isValid: false,
    invalidReason: "No token transfer instruction found",
  };
}
```

### 5. Recipient Verification

```typescript
if (transfer.destinationOwner !== expectedRecipient.toBase58()) {
  return {
    isValid: false,
    invalidReason: `Wrong recipient: expected ${expectedRecipient}, got ${transfer.destinationOwner}`,
  };
}
```

### 6. Amount Verification

```typescript
const transferAmount = BigInt(transfer.amount);
if (transferAmount < expectedAmount) {
  return {
    isValid: false,
    invalidReason: `Insufficient amount: expected ${expectedAmount}, got ${transferAmount}`,
  };
}
```

### 7. Token Verification

```typescript
if (transfer.mint !== expectedMint.toBase58()) {
  return {
    isValid: false,
    invalidReason: `Wrong token: expected ${expectedMint}, got ${transfer.mint}`,
  };
}
```

## Complete Example

```typescript
import { verifyPayment, getUsdcMint } from "x402test";
import { PublicKey } from "@solana/web3.js";

async function verifyUserPayment(
  signature: string,
  recipientAddress: string,
  expectedUsdcAmount: string
) {
  // Convert USDC to atomic units
  const atomicAmount = BigInt(parseFloat(expectedUsdcAmount) * 1e6);

  // Verify payment
  const result = await verifyPayment(
    signature,
    new PublicKey(recipientAddress),
    atomicAmount,
    getUsdcMint()
  );

  if (result.isValid) {
    console.log("✓ Payment verified");
    console.log("  From:", result.from);
    console.log("  To:", result.to);
    console.log("  Amount:", result.amount);
    console.log("  TX:", result.txHash);
    return true;
  } else {
    console.error("✗ Verification failed");
    console.error("  Reason:", result.invalidReason);
    return false;
  }
}

// Usage
await verifyUserPayment("5XzT4qW3...", "FcxKSp7YxqYXdq...", "0.10");
```

## Error Handling

### Try-Catch

```typescript
try {
  const result = await verifyPayment(signature, recipient, amount, mint);

  if (!result.isValid) {
    // Handle verification failure
    console.error(result.invalidReason);
  }
} catch (error) {
  // Handle unexpected errors
  console.error("Verification error:", error.message);
}
```

### Using with x402 Client

The x402 client automatically verifies payments:

```typescript
import { x402 } from "x402test";

// Automatic verification
const response = await x402(url)
  .withPayment("0.01")
  .expectPaymentSettled() // This calls verifyPayment()
  .execute();

// Payment is verified on-chain
console.log("Verified signature:", response.payment?.signature);
```

## Common Failure Reasons

### Transaction Not Found

```
"Transaction not found or not confirmed"
```

**Causes:**

- Transaction hasn't confirmed yet
- Invalid signature
- Wrong network (devnet vs mainnet)

### Insufficient Amount

```
"Insufficient amount: expected 100000, got 50000"
```

**Causes:**

- Client paid less than required
- Wrong decimal conversion

### Wrong Recipient

```
"Wrong recipient: expected FcxK..., got EPjF..."
```

**Causes:**

- Payment sent to wrong address
- Configuration mismatch

### Payment Already Processed

```
"Payment already processed"
```

**Causes:**

- Replay attack attempt
- Accidental duplicate request

### Wrong Token

```
"Wrong token: expected EPjF... (USDC), got 4zMMC... (SOL)"
```

**Causes:**

- Paid with wrong SPL token
- Wrong mint address in config

## Replay Protection Functions

### isSignatureUsed()

Checks if a signature has been used.

```typescript
import { isSignatureUsed } from "x402test";

if (isSignatureUsed(signature)) {
  console.log("Signature already used");
}
```

### markSignatureUsed()

Marks a signature as used.

```typescript
import { markSignatureUsed } from "x402test";

markSignatureUsed(signature, endpoint, amount);
```

### getSignatureInfo()

Gets information about a used signature.

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

Gets statistics about all signatures.

```typescript
import { getSignatureStats } from "x402test";

const stats = getSignatureStats();
console.log("Total signatures:", stats.total);
console.log("Signatures:", stats.signatures);
```

### resetSignatures()

Clears all signature records (for testing).

```typescript
import { resetSignatures } from "x402test";

resetSignatures();
console.log("All signatures cleared");
```

## Next Steps

- [Wallets](/api/wallets) - Wallet management
- [Replay Protection](/advanced/replay-protection) - Deep dive
- [Examples](/examples/basic-payment) - Complete examples
