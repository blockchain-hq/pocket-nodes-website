---
title: Payment Flow
description: Deep dive into the x402 payment flow implementation
---


This guide provides a detailed walkthrough of the payment flow in x402test, from initial request to final response.

## Overview

The payment flow consists of six main steps:

1. Initial request without payment
2. Server returns 402 with payment requirements
3. Client creates and signs transaction
4. Client submits transaction to blockchain
5. Client retries request with payment proof
6. Server verifies and returns protected content

## Detailed Flow

### Step 1: Initial Request

The client makes a GET request to a payment-protected endpoint:

```typescript
const response = await fetch("http://localhost:4402/api/premium", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});
```

The request does not include any payment information.

### Step 2: Payment Required Response

The server responds with status code 402 and payment requirements:

```typescript
// Response status: 402
// Response body:
{
  x402Version: 1,
  accepts: [{
    scheme: "solanaTransferChecked",
    network: "solana-devnet",
    maxAmountRequired: "100000",      // 0.10 USDC
    resource: "http://localhost:4402/api/premium",
    description: "Premium content access",
    mimeType: "application/json",
    payTo: "FcxKSp7YxqYXdq...",       // Recipient wallet
    asset: "EPjFWdd5AufqSSqeM2...",   // USDC mint
    maxTimeoutSeconds: 30
  }],
  error: null
}
```

### Step 3: Parse Requirements

The client parses the payment requirements:

```typescript
import { parse402Response } from "x402test";

const requirements = parse402Response(responseBody);

console.log("Amount required:", requirements.maxAmountRequired);
console.log("Pay to:", requirements.payTo);
console.log("Asset:", requirements.asset);
```

### Step 4: Create Payment

The client creates a Solana SPL token transfer:

```typescript
import { createPayment } from "x402test";

// Get test wallet
const wallet = await getWallet();

// Create and sign transaction
const signature = await createPayment(wallet, requirements);

console.log("Transaction signature:", signature);
// Output: "5XzT4qW3..."
```

This process:

1. Gets or creates token accounts for sender and recipient
2. Creates a `transferChecked` instruction
3. Signs the transaction with the wallet keypair
4. Submits to the Solana blockchain
5. Waits for confirmation

### Step 5: Create Payment Header

The client creates the `X-PAYMENT` header:

```typescript
import { createXPaymentHeader } from "x402test";

const paymentHeader = createXPaymentHeader(
  signature,
  requirements,
  wallet.publicKey.toBase58()
);

// Header value is base64-encoded JSON:
// eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoi...
```

Header structure:

```json
{
  "x402Version": 1,
  "scheme": "solanaTransferChecked",
  "network": "solana-devnet",
  "payload": {
    "signature": "5XzT4qW3...",
    "from": "FcxKSp7YxqYX...",
    "amount": "100000",
    "mint": "EPjFWdd5Aufq...",
    "timestamp": 1699564800000
  }
}
```

### Step 6: Retry with Payment

The client retries the request with the payment header:

```typescript
const response = await fetch("http://localhost:4402/api/premium", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "X-PAYMENT": paymentHeader,
  },
});
```

### Step 7: Server Verification

The server verifies the payment:

```typescript
// 1. Decode X-PAYMENT header
const payment = parse402PaymentHeader(req.headers["x-payment"]);

// 2. Verify on blockchain
const verification = await verifyPayment(
  payment.payload.signature,
  new PublicKey(recipientAddress),
  BigInt(expectedAmount),
  usdcMintAddress
);

if (!verification.isValid) {
  return res.status(402).json({
    error: verification.invalidReason,
  });
}

// 3. Mark signature as used
markSignatureUsed(payment.payload.signature, req.path, payment.payload.amount);

// 4. Return protected content
res.status(200).json({
  data: "This is premium content!",
  timestamp: Date.now(),
});
```

### Step 8: Success Response

If verification succeeds, the server returns the protected content:

```typescript
// Response status: 200
// Response headers:
{
  "Content-Type": "application/json",
  "X-PAYMENT-RESPONSE": "eyJzdWNjZXNzIjp0cnVlLCJ0eEhhc2giOi..."
}

// Response body:
{
  "data": "This is premium content!",
  "timestamp": 1699564800000
}
```

The `X-PAYMENT-RESPONSE` header contains:

```json
{
  "success": true,
  "error": null,
  "txHash": "5XzT4qW3...",
  "networkId": "solana-devnet"
}
```

## Automated Flow with x402test

The x402test client automates this entire flow:

```typescript
import { x402 } from "x402test";

// All steps happen automatically
const response = await x402("http://localhost:4402/api/premium")
  .withPayment({ amount: "0.10" })
  .expectStatus(200)
  .execute();

// Response includes payment details
console.log("Payment signature:", response.payment?.signature);
console.log("Amount paid:", response.payment?.amount);
console.log("From:", response.payment?.from);
console.log("To:", response.payment?.to);
```

## Verification Process

### Transaction Lookup

The server fetches the transaction from Solana:

```typescript
const connection = getConnection();
const tx = await connection.getTransaction(signature, {
  commitment: "confirmed",
  maxSupportedTransactionVersion: 0,
});

if (!tx) {
  return { isValid: false, invalidReason: "Transaction not found" };
}
```

### Amount Verification

Check the transferred amount:

```typescript
const transferAmount = BigInt(transfer.amount);
const expectedAmount = BigInt(requirements.maxAmountRequired);

if (transferAmount < expectedAmount) {
  return {
    isValid: false,
    invalidReason: `Insufficient amount: expected ${expectedAmount}, got ${transferAmount}`,
  };
}
```

### Recipient Verification

Verify the recipient address:

```typescript
if (transfer.destinationOwner !== expectedRecipient.toBase58()) {
  return {
    isValid: false,
    invalidReason: `Wrong recipient: expected ${expectedRecipient}, got ${transfer.destinationOwner}`,
  };
}
```

### Token Verification

Confirm the correct token was used:

```typescript
if (transfer.mint !== expectedMint.toBase58()) {
  return {
    isValid: false,
    invalidReason: `Wrong token: expected ${expectedMint}, got ${transfer.mint}`,
  };
}
```

### Replay Check

Ensure the signature hasn't been used:

```typescript
if (isSignatureUsed(signature)) {
  return {
    isValid: false,
    invalidReason: "Payment already processed",
  };
}
```

## Error Scenarios

### Insufficient Payment

```typescript
// Server requires 0.10 USDC
// Client pays 0.05 USDC

const response = await x402(url).withPayment("0.05").execute();

// Error: "Client max amount 50000 is less than server required amount 100000"
```

### Transaction Not Confirmed

```typescript
// Transaction hasn't been confirmed yet

// Error: "Transaction not found or not confirmed"
```

### Replay Attack

```typescript
// Attempting to reuse a signature

// Error: "Payment already processed"
```

### Network Mismatch

```typescript
// Server expects devnet, transaction on mainnet

// Error: "Network mismatch"
```

## Best Practices

### Client-Side

1. **Check Requirements**: Always parse and validate requirements before paying
2. **Validate Amount**: Ensure you're willing to pay the required amount
3. **Handle Errors**: Implement proper error handling for failed payments
4. **Retry Logic**: Implement exponential backoff for transaction confirmation
5. **Log Transactions**: Keep records of all payment transactions

### Server-Side

1. **Clear Requirements**: Provide detailed payment requirements
2. **Verify Completely**: Don't skip any verification steps
3. **Track Signatures**: Always check for replay attacks
4. **Error Messages**: Return clear, actionable error messages
5. **Timeout Handling**: Implement reasonable timeout for payment confirmation

## Next Steps

- [Testing Client](/testing-client) - Learn about the testing client
- [Mock Server](/mock-server) - Set up the mock server
- [API Reference](/api/verification) - Verification API details
- [Examples](/examples/basic-payment) - See complete examples
