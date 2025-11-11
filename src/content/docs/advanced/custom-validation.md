---
title: Custom Validation
description: Implement custom validation logic for your payment flows
---


Extend x402test with custom validation logic for requests, responses, and payments.

## Client-Side Validation

### Custom Response Validation

Validate response data with custom logic:

```typescript
import { x402 } from "x402test";

const response = await x402(url)
  .withPayment("0.01")
  .expectBody((body) => {
    // Custom validation logic
    if (!body.data) return false;
    if (body.data.length === 0) return false;
    if (!body.timestamp) return false;

    return true;
  })
  .execute();
```

### Schema Validation with Zod

Use Zod for type-safe response validation:

```typescript
import { z } from "zod";
import { x402 } from "x402test";

const ResponseSchema = z.object({
  data: z.string(),
  timestamp: z.number(),
  metadata: z.object({
    version: z.string(),
    format: z.string(),
  }),
});

const response = await x402(url)
  .withPayment("0.01")
  .expectBody((body) => {
    try {
      ResponseSchema.parse(body);
      return true;
    } catch {
      return false;
    }
  })
  .execute();

// Type-safe response
const validated = ResponseSchema.parse(response.body);
console.log(validated.data); // TypeScript knows this is a string
```

### Multiple Validators

Chain multiple validation checks:

```typescript
class ResponseValidator {
  private validators: Array<(body: any) => boolean> = [];

  add(validator: (body: any) => boolean): this {
    this.validators.push(validator);
    return this;
  }

  validate(body: any): boolean {
    return this.validators.every((validator) => validator(body));
  }
}

// Usage
const validator = new ResponseValidator()
  .add((body) => body.data !== undefined)
  .add((body) => body.timestamp > Date.now() - 60000)
  .add((body) => body.metadata?.version === "1.0");

const response = await x402(url)
  .withPayment("0.01")
  .expectBody((body) => validator.validate(body))
  .execute();
```

## Server-Side Validation

### Request Parameter Validation

Validate query parameters in your mock server:

```javascript
// x402test.config.js
export default {
  routes: {
    "/api/users": {
      price: "0.01",
      response: (req) => {
        // Validate query parameters
        if (!req.query.userId) {
          return { error: "userId required", status: 400 };
        }

        // Validate format
        if (!/^\d+$/.test(req.query.userId)) {
          return { error: "Invalid userId format", status: 400 };
        }

        // Return data
        return {
          user: {
            id: req.query.userId,
            name: "User " + req.query.userId,
          },
        };
      },
    },
  },
};
```

### Request Body Validation

Validate POST/PUT request bodies:

```javascript
routes: {
  '/api/create': {
    price: '0.05',
    response: (req) => {
      const { name, email, age } = req.body;

      // Required fields
      if (!name || !email) {
        return {
          error: 'name and email are required',
          status: 400
        };
      }

      // Email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
          error: 'Invalid email format',
          status: 400
        };
      }

      // Age range
      if (age && (age < 18 || age > 120)) {
        return {
          error: 'Age must be between 18 and 120',
          status: 400
        };
      }

      // Valid request - return 201 Created
      return {
        status: 201,
        user: { name, email, age }
      };
    }
  }
}
```

### Header Validation

Validate request headers:

```javascript
routes: {
  '/api/authenticated': {
    price: '0.02',
    response: (req) => {
      // Check API key
      const apiKey = req.headers['x-api-key'];
      if (!apiKey || apiKey !== process.env.API_KEY) {
        return {
          error: 'Invalid API key',
          status: 401
        };
      }

      // Check content type
      if (req.headers['content-type'] !== 'application/json') {
        return {
          error: 'Content-Type must be application/json',
          status: 415
        };
      }

      return { data: 'Authenticated data' };
    }
  }
}
```

## Payment Validation

### Custom Amount Validation

Validate payment amounts are within acceptable ranges:

```typescript
import { verifyPayment } from "x402test";

async function verifyPaymentInRange(
  signature: string,
  recipient: PublicKey,
  minAmount: bigint,
  maxAmount: bigint,
  mint: PublicKey
): Promise<VerificationResult> {
  // Standard verification
  const result = await verifyPayment(signature, recipient, minAmount, mint);

  if (!result.isValid) {
    return result;
  }

  // Check maximum amount
  const amount = BigInt(result.amount || "0");
  if (amount > maxAmount) {
    return {
      isValid: false,
      invalidReason: `Amount ${amount} exceeds maximum ${maxAmount}`,
    };
  }

  return result;
}
```

### Time-Based Validation

Ensure payments are recent:

```typescript
interface TimedPaymentRequirements {
  signature: string;
  timestamp: number;
  maxAge: number; // seconds
}

function validatePaymentAge(payment: TimedPaymentRequirements): boolean {
  const age = (Date.now() - payment.timestamp) / 1000;

  if (age > payment.maxAge) {
    throw new Error(`Payment expired: ${age}s > ${payment.maxAge}s`);
  }

  return true;
}
```

## Integration Testing

Test your custom validation:

```typescript
import { describe, it, expect } from "vitest";
import { x402 } from "x402test";

describe("Custom Validation", () => {
  it("should validate response schema", async () => {
    const response = await x402("http://localhost:4402/api/data")
      .withPayment("0.01")
      .expectBody((body) => {
        return (
          typeof body.data === "string" &&
          typeof body.timestamp === "number" &&
          body.timestamp > 0
        );
      })
      .execute();

    expect(response.body.data).toBeDefined();
  });

  it("should reject invalid responses", async () => {
    await expect(
      x402("http://localhost:4402/api/invalid")
        .withPayment("0.01")
        .expectBody((body) => body.requiredField !== undefined)
        .execute()
    ).rejects.toThrow("Body validation failed");
  });
});
```

## Best Practices

1. **Validate Early**: Check inputs before processing
2. **Clear Errors**: Return descriptive error messages
3. **Type Safety**: Use TypeScript and schema validation
4. **Security First**: Never trust client input
5. **Performance**: Keep validation logic efficient

## Next Steps

- [Configuration](/advanced/configuration/) - Advanced server configuration
- [API Reference](/api/client/) - Complete API documentation
- [Examples](/examples/basic-payment/) - See validation in action
