---
title: Error Handling
description: Handle different error scenarios in payment flows
---


Learn how to handle different error scenarios when working with payment-protected APIs.

## Code

```typescript
import { x402, X402Error } from "x402test";

async function example() {
  console.log("Example 4: Error Handling\n");

  // Scenario 1: Insufficient amount
  console.log("Scenario 1: Client specifies too low amount");
  try {
    await x402("http://localhost:4402/api/premium")
      .withPayment({ amount: "0.01" }) // Too low! Premium costs 0.10
      .expectStatus(200)
      .execute();
    console.log("✘ Should have failed!");
  } catch (error) {
    if (error instanceof X402Error) {
      console.log("✔ Correctly rejected:");
      console.log(`   ${error.message}\n`);
    }
  }

  // Scenario 2: Wrong status expected
  console.log("Scenario 2: Wrong status expectation");
  try {
    await x402("http://localhost:4402/api/data")
      .withPayment({ amount: "0.01" })
      .expectStatus(404) // Expecting wrong status
      .execute();
    console.log("✘ Should have failed!");
  } catch (error) {
    console.log("✔ Assertion failed as expected:");
    console.log(`   ${(error as Error).message}\n`);
  }

  // Scenario 3: Server unreachable
  console.log("Scenario 3: Server unreachable");
  try {
    await x402("http://localhost:9999/api/test") // Wrong port
      .withPayment({ amount: "0.01" })
      .expectStatus(200)
      .execute();
    console.log("✘ Should have failed!");
  } catch (error) {
    console.log("✔ Connection error handled:");
    console.log(`   ${(error as Error).message}\n`);
  }

  // Scenario 4: Graceful handling
  console.log("Scenario 4: Graceful error recovery");
  try {
    const response = await x402("http://localhost:4402/api/premium")
      .withPayment("0.01")
      .execute();
    console.log("Response:", response.status);
  } catch (error) {
    console.log("✔ Error caught and handled gracefully");
    console.log("   Application continues running...\n");
  }

  console.log("✔ All error scenarios handled correctly!");
}

example();
```

## Error Types

### X402Error

General x402 errors.

```typescript
import { X402Error } from "x402test";

try {
  await x402(url).withPayment("0.01").execute();
} catch (error) {
  if (error instanceof X402Error) {
    console.error("Payment error:", error.message);
  }
}
```

### X402ParseError

Failed to parse 402 response.

```typescript
import { X402ParseError } from "x402test";

try {
  await x402(url).withPayment("0.01").execute();
} catch (error) {
  if (error instanceof X402ParseError) {
    console.error("Parse error:", error.message);
    if (error.zodError) {
      console.error("Validation errors:", error.zodError.issues);
    }
  }
}
```

### PaymentCreationError

Failed to create payment transaction.

```typescript
import { PaymentCreationError } from "x402test";

try {
  await x402(url).withPayment("0.01").execute();
} catch (error) {
  if (error instanceof PaymentCreationError) {
    console.error("Payment creation failed:", error.message);
    console.error("Cause:", error.cause);
  }
}
```

### PaymentVerificationError

Payment verification failed.

```typescript
import { PaymentVerificationError } from "x402test";

try {
  await x402(url).withPayment("0.01").execute();
} catch (error) {
  if (error instanceof PaymentVerificationError) {
    console.error("Verification failed:", error.message);
    console.error("Signature:", error.signature);
    console.error("Reason:", error.reason);
  }
}
```

### AssertionError

Expectation not met.

```typescript
import { AssertionError } from "x402test";

try {
  await x402(url).withPayment("0.01").expectStatus(200).execute();
} catch (error) {
  if (error instanceof AssertionError) {
    console.error("Assertion failed:", error.message);
  }
}
```

## Retry Logic

### Simple Retry

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${i + 1} failed:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw lastError!;
}

// Usage
const response = await withRetry(() =>
  x402("http://localhost:4402/api/data").withPayment("0.01").execute()
);
```

### Exponential Backoff

```typescript
async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

## Fallback Strategies

### Alternative Endpoints

```typescript
async function requestWithFallback(data: any) {
  const endpoints = [
    { url: "/api/premium", price: "0.10" },
    { url: "/api/basic", price: "0.01" },
  ];

  for (const endpoint of endpoints) {
    try {
      return await x402(`http://localhost:4402${endpoint.url}`)
        .post(data)
        .withPayment(endpoint.price)
        .execute();
    } catch (error) {
      console.log(`${endpoint.url} failed, trying next...`);
    }
  }

  throw new Error("All endpoints failed");
}
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private readonly threshold = 5;
  private state: "closed" | "open" | "half-open" = "closed";
  private nextAttempt = Date.now();

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is open");
      }
      this.state = "half-open";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "open";
      this.nextAttempt = Date.now() + 60000; // 1 minute
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

const response = await breaker.execute(() =>
  x402("http://localhost:4402/api/data").withPayment("0.01").execute()
);
```

## Next Steps

- [AI Agent](/examples/ai-agent) - Autonomous agent with error handling
- [Advanced Configuration](/advanced/configuration) - Advanced setup
