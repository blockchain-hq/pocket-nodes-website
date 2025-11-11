---
title: Basic Payment
description: Simple payment flow example
---


The most basic x402test usage - make a request that requires payment.

## Prerequisites

1. **Solana validator** running:

   ```bash
   solana-test-validator
   ```

2. **x402test server** running:
   ```bash
   npx x402test start
   ```

## Code

Create `01-simple-payment.ts`:

```typescript
import { x402 } from "x402test";

async function example() {
  console.log("Example 1: Simple Payment\n");

  try {
    // Make a request to a payment-protected endpoint
    const response = await x402("http://localhost:4402/api/data")
      .withPayment({ amount: "0.01" }) // Willing to pay up to 0.01 USDC
      .expectStatus(200) // Expect success
      .execute();

    console.log("✔ Payment successful!");
    console.log("Response:", JSON.stringify(response.body, null, 2));
    console.log("Payment signature:", response.payment?.signature);
  } catch (error) {
    console.error("✘ Payment failed:", error);
    process.exit(1);
  }
}

example();
```

## Run

```bash
npx tsx 01-simple-payment.ts
```

## Expected Output

```
Example 1: Simple Payment

✔ Payment successful!
Response: {
  "method": "GET",
  "path": "/api/data",
  "data": {
    "message": "Your data here"
  }
}
Payment signature: 5XzT4qW3Hk2p7vN...
```

## What's Happening

### 1. Initial Request

The client makes a GET request to `/api/data`:

```http
GET /api/data HTTP/1.1
Host: localhost:4402
```

### 2. Server Response (402)

Server returns payment requirements:

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "solanaTransferChecked",
    "network": "solana-devnet",
    "maxAmountRequired": "10000",
    "resource": "http://localhost:4402/api/data",
    "payTo": "FcxKSp7YxqYXdq...",
    "asset": "EPjFWdd5AufqSSqeM2..."
  }]
}
```

### 3. Payment Creation

The client automatically:

- Creates a USDC transfer transaction
- Signs with test wallet
- Submits to Solana blockchain
- Waits for confirmation

### 4. Retry with Payment

Client retries with X-PAYMENT header:

```http
GET /api/data HTTP/1.1
Host: localhost:4402
X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6...
```

### 5. Server Verification

Server verifies:

- Transaction exists and succeeded
- Amount matches requirement
- Recipient is correct
- Token is USDC
- Signature not already used

### 6. Success Response

Server returns protected content:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "method": "GET",
  "path": "/api/data",
  "data": {
    "message": "Your data here"
  }
}
```

## Key Concepts

### withPayment()

Specifies maximum amount willing to pay:

```typescript
.withPayment({ amount: "0.01" })  // Object form
.withPayment("0.01")               // String form
```

### expectStatus()

Asserts response status code:

```typescript
.expectStatus(200)  // Expect 200 OK
```

Throws error if status doesn't match.

### execute()

Executes the request:

```typescript
const response = await request.execute();
```

Returns `X402Response<T>` with:

- `status`: HTTP status code
- `body`: Response body
- `payment`: Payment details (if payment was made)

## Variations

### Without Expectations

```typescript
const response = await x402("http://localhost:4402/api/data")
  .withPayment("0.01")
  .execute();

// Manually check status
if (response.status === 200) {
  console.log("Success:", response.body);
} else {
  console.error("Failed:", response.status);
}
```

### With Additional Validation

```typescript
const response = await x402("http://localhost:4402/api/data")
  .withPayment("0.01")
  .expectStatus(200)
  .expectPaymentSettled()
  .expectBody((body) => body.data !== undefined)
  .execute();
```

### Error Handling

```typescript
try {
  const response = await x402(url)
    .withPayment("0.01")
    .expectStatus(200)
    .execute();

  console.log("Success:", response.body);
} catch (error) {
  if (error.message.includes("less than server required")) {
    console.error("Payment amount too low");
  } else {
    console.error("Request failed:", error.message);
  }
}
```

## Troubleshooting

### Error: "Connection refused"

**Cause:** Server not running

**Solution:**

```bash
npx x402test start
```

### Error: "Transaction not found"

**Cause:** Solana validator not running or transaction not confirmed

**Solution:**

```bash
solana-test-validator

```

### Error: "Insufficient balance"

**Cause:** Test wallet depleted

**Solution:**

```bash
rm .x402test-wallets.json
npx x402test init
```

## Next Steps

- [Multiple Endpoints](/examples/multiple-endpoints) - Different price tiers
- [Error Handling](/examples/error-handling) - Handle failures
- [AI Agent](/examples/ai-agent) - Autonomous agent example
