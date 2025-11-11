---
title: Quick Start
description: Get started with x402test in minutes
---


This guide will help you make your first payment-protected request with x402test.

## Setup

If you haven't already, install and initialize x402test:

```bash
pnpm add -D x402test
npx x402test init
```

## Start the Mock Server

Open a terminal and start the x402test server:

```bash
npx x402test start
```

Keep this running in the background. The server will listen on `http://localhost:4402`.

## Make Your First Payment Request

Create a new file `test-payment.ts`:

```typescript
import { x402 } from "x402test";

async function testPayment() {
  try {
    // Make a request to a payment-protected endpoint
    const response = await x402("http://localhost:4402/api/data")
      .withPayment({ amount: "0.01" })
      .expectStatus(200)
      .execute();

    console.log("✓ Payment successful!");
    console.log("Response:", response.body);
    console.log("Payment signature:", response.payment?.signature);
  } catch (error) {
    console.error("Payment failed:", error);
  }
}

testPayment();
```

Run the test:

```bash
npx tsx test-payment.ts
```

## Understanding the Response

A successful payment request returns:

```typescript
{
  status: 200,
  statusText: "OK",
  headers: Headers,
  body: {
    method: "GET",
    path: "/api/data",
    data: { message: "Your data here" }
  },
  payment: {
    signature: "5Xz...", // Solana transaction signature
    amount: "10000",    // Amount in atomic units (0.01 USDC)
    from: "FcxK...",    // Your wallet address
    to: "EPjF..."       // Recipient address
  }
}
```

## Handle 402 Responses

When you make a request without payment, you'll receive a 402 response:

```typescript
const response = await fetch("http://localhost:4402/api/premium");

if (response.status === 402) {
  const requirements = await response.json();
  console.log("Payment required:", requirements);
  /*
  {
    x402Version: 1,
    accepts: [{
      scheme: "solanaTransferChecked",
      network: "solana-devnet",
      maxAmountRequired: "100000",  // 0.10 USDC
      resource: "http://localhost:4402/api/premium",
      description: "Premium content access",
      payTo: "FcxKSp...",
      asset: "EPjFWdd..."           // USDC mint address
    }]
  }
  */
}
```

The x402test client automatically handles this for you when you use `.withPayment()`.

## Multiple Endpoints

Test different pricing tiers:

```typescript
// Cheap endpoint - 0.01 USDC
const dataResponse = await x402("http://localhost:4402/api/data")
  .withPayment("0.01")
  .expectStatus(200)
  .execute();

// Premium endpoint - 0.10 USDC
const premiumResponse = await x402("http://localhost:4402/api/premium")
  .withPayment("0.10")
  .expectStatus(200)
  .execute();
```

## Verify Payments On-Chain

Add payment verification to ensure transactions are confirmed:

```typescript
const response = await x402("http://localhost:4402/api/premium")
  .withPayment("0.10")
  .expectStatus(200)
  .expectPaymentSettled() // Verifies on blockchain
  .execute();
```

## Error Handling

Handle common errors:

```typescript
try {
  const response = await x402("http://localhost:4402/api/premium")
    .withPayment("0.05") // Too low!
    .execute();
} catch (error) {
  if (error.message.includes("less than server required")) {
    console.error("Payment amount too low");
  }
}
```

## Custom Validation

Add custom response validation:

```typescript
const response = await x402("http://localhost:4402/api/data")
  .withPayment("0.01")
  .expectStatus(200)
  .expectBody((body) => {
    return body.data && body.data.message;
  })
  .expectHeader("Content-Type", "application/json")
  .execute();
```

## Testing with Vitest

Integrate with your test suite:

```typescript
import { describe, it, expect } from "vitest";
import { x402 } from "x402test";

describe("Payment Flow", () => {
  it("should process payment successfully", async () => {
    const response = await x402("http://localhost:4402/api/data")
      .withPayment("0.01")
      .expectStatus(200)
      .expectPaymentSettled()
      .execute();

    expect(response.payment).toBeDefined();
    expect(response.payment?.signature).toMatch(
      /^[1-9A-HJ-NP-Za-km-z]{87,88}$/
    );
  });

  it("should reject insufficient payment", async () => {
    await expect(
      x402("http://localhost:4402/api/premium").withPayment("0.05").execute()
    ).rejects.toThrow();
  });
});
```

## Next Steps

Now that you've made your first payment request:

- [How x402 Works](/how-it-works) - Understand the protocol
- [Payment Flow](/payment-flow) - Deep dive into payment process
- [API Reference](/api/client) - Explore all client methods
- [Examples](/examples/basic-payment) - See more examples
