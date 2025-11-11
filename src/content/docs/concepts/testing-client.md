---
title: Testing Client
description: Learn how to use the x402test testing client
---


The x402test client provides a fluent interface for making payment-protected HTTP requests with automatic payment handling.

## Basic Usage

```typescript
import { x402 } from "x402test";

const response = await x402("http://localhost:4402/api/data")
  .withPayment({ amount: "0.01" })
  .expectStatus(200)
  .execute();
```

## Client API

### Creating a Request

```typescript
import { x402, request } from "x402test";

// Using x402 (alias)
const req1 = x402("http://localhost:4402/api/data");

// Using request (alias)
const req2 = request("http://localhost:4402/api/data");
```

### HTTP Methods

```typescript
// GET (default)
x402(url).get().execute();

// POST
x402(url).post({ data: "value" }).execute();

// PUT
x402(url).put({ data: "updated" }).execute();

// DELETE
x402(url).delete().execute();
```

### Headers

```typescript
// Single header
x402(url).header("Content-Type", "application/json").execute();

// Multiple headers
x402(url)
  .headers({
    "Content-Type": "application/json",
    Authorization: "Bearer token",
  })
  .execute();
```

### Request Body

```typescript
// Set body directly
x402(url).body({ key: "value" }).execute();

// Body with POST
x402(url).post({ key: "value" }).execute();
```

## Payment Methods

### With Payment

```typescript
// String amount
x402(url).withPayment("0.01").execute();

// Object with amount
x402(url).withPayment({ amount: "0.01" }).execute();
```

### Without Payment

```typescript
// Request without payment (will get 402)
const response = await x402(url).execute();
console.log(response.status); // 402
```

## Assertions

### Status Code

```typescript
// Expect specific status
await x402(url).withPayment("0.01").expectStatus(200).execute();

// Error if status doesn't match
await x402(url).withPayment("0.01").expectStatus(404).execute();
// Throws: "Expected status 404 but got 200"
```

### Payment Settled

```typescript
// Verify payment on blockchain
await x402(url).withPayment("0.01").expectPaymentSettled().execute();
```

### Payment Amount

```typescript
// Verify exact amount paid
await x402(url)
  .withPayment("0.01")
  .expectPaymentAmount("10000") // atomic units
  .execute();
```

### Response Body

```typescript
// Exact match
await x402(url).withPayment("0.01").expectBody({ key: "value" }).execute();

// Custom validation
await x402(url)
  .withPayment("0.01")
  .expectBody((body) => {
    return body.data && body.data.length > 0;
  })
  .execute();
```

### Response Headers

```typescript
// Exact header value
await x402(url)
  .withPayment("0.01")
  .expectHeader("Content-Type", "application/json")
  .execute();

// Regex match
await x402(url)
  .withPayment("0.01")
  .expectHeader("Content-Type", /application\/json/)
  .execute();
```

## Response Object

### Structure

```typescript
interface X402Response<T> {
  status: number;
  statusText: string;
  headers: Headers;
  body: T;
  payment?: {
    signature: string;
    amount: string;
    from: string;
    to: string;
  };
}
```

### Accessing Response Data

```typescript
const response = await x402(url).withPayment("0.01").execute();

// Status
console.log(response.status); // 200
console.log(response.statusText); // "OK"

// Headers
console.log(response.headers.get("Content-Type"));

// Body
console.log(response.body);

// Payment details
if (response.payment) {
  console.log("Signature:", response.payment.signature);
  console.log("Amount:", response.payment.amount);
  console.log("From:", response.payment.from);
  console.log("To:", response.payment.to);
}
```

## Error Handling

### Try-Catch

```typescript
try {
  const response = await x402(url)
    .withPayment("0.01")
    .expectStatus(200)
    .execute();
} catch (error) {
  if (error instanceof X402Error) {
    console.error("Payment error:", error.message);
  } else if (error instanceof AssertionError) {
    console.error("Assertion failed:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

### Error Types

```typescript
import {
  X402Error,
  X402ParseError,
  PaymentCreationError,
  PaymentVerificationError,
  AssertionError,
} from "x402test";

// X402Error - General errors
// X402ParseError - Failed to parse 402 response
// PaymentCreationError - Failed to create payment
// PaymentVerificationError - Payment verification failed
// AssertionError - Expectation not met
```

## Advanced Usage

### Multiple Assertions

```typescript
await x402(url)
  .withPayment("0.01")
  .expectStatus(200)
  .expectPaymentSettled()
  .expectHeader("Content-Type", "application/json")
  .expectBody((body) => body.success === true)
  .execute();
```

### Sequential Requests

```typescript
// Request 1
const response1 = await x402("http://localhost:4402/api/data")
  .withPayment("0.01")
  .execute();

// Request 2 (different endpoint)
const response2 = await x402("http://localhost:4402/api/premium")
  .withPayment("0.10")
  .execute();
```

### Custom Wallets

```typescript
import { getWallet, resetWallets } from "x402test";

// Get current wallet
const wallet = await getWallet();
console.log("Address:", wallet.publicKey.toBase58());
console.log("Balance:", wallet.balance);

// Reset wallets (creates new ones)
await resetWallets();
```

## Integration with Testing Frameworks

### Vitest

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { x402 } from "x402test";

describe("Payment API", () => {
  it("should process payment", async () => {
    const response = await x402("http://localhost:4402/api/data")
      .withPayment("0.01")
      .expectStatus(200)
      .execute();

    expect(response.payment).toBeDefined();
    expect(response.body).toHaveProperty("data");
  });
});
```

### Jest

```typescript
import { x402 } from "x402test";

describe("Payment API", () => {
  test("should process payment", async () => {
    const response = await x402("http://localhost:4402/api/data")
      .withPayment("0.01")
      .expectStatus(200)
      .execute();

    expect(response.payment).toBeDefined();
    expect(response.body).toHaveProperty("data");
  });
});
```

## Next Steps

- [Mock Server](/mock-server) - Set up the test server
- [API Reference](/api/client) - Complete API documentation
- [Examples](/examples/basic-payment) - See more examples
