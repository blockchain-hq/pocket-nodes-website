---
title: Multiple Endpoints
description: Test multiple endpoints with different price tiers
---


Test multiple payment-protected endpoints with different pricing tiers.

## Code

```typescript
import { x402 } from "x402test";

async function example() {
  console.log("Example 3: Multiple Endpoints\n");

  try {
    // Cheap endpoint - 0.01 USDC
    console.log("Request to basic endpoint (/api/data)...");
    const response1 = await x402("http://localhost:4402/api/data")
      .withPayment({ amount: "0.01" })
      .expectStatus(200)
      .execute();

    console.log("✔ Basic endpoint accessed");
    console.log(`   Cost: 0.01 USDC`);
    console.log(`   Data: ${JSON.stringify(response1.body)}\n`);

    // Expensive endpoint - 0.10 USDC
    console.log("Request to premium endpoint (/api/premium)...");
    const response2 = await x402("http://localhost:4402/api/premium")
      .withPayment({ amount: "0.10" })
      .expectStatus(200)
      .execute();

    console.log("✔ Premium endpoint accessed");
    console.log(`   Cost: 0.10 USDC`);
    console.log(`   Data: ${JSON.stringify(response2.body)}\n`);

    // Summary
    console.log("✔ Summary:");
    console.log(`   Total spent: 0.11 USDC`);
    console.log(`   Requests made: 2`);
    console.log(`   All payments verified on-chain ✔`);
  } catch (error) {
    console.error("✘ Error:", error);
    process.exit(1);
  }
}

example();
```

## Configuration

In `x402test.config.js`:

```javascript
export default {
  // ... other config
  routes: {
    "/api/basic": {
      price: "0.01",
      description: "Basic tier - 1 cent",
      response: {
        tier: "basic",
        features: ["feature1", "feature2"],
      },
    },
    "/api/premium": {
      price: "0.10",
      description: "Premium tier - 10 cents",
      response: {
        tier: "premium",
        features: ["feature1", "feature2", "feature3", "premium1"],
      },
    },
    "/api/enterprise": {
      price: "1.00",
      description: "Enterprise tier - 1 dollar",
      response: {
        tier: "enterprise",
        features: ["all features", "priority support", "custom integration"],
      },
    },
  },
};
```

## Output

```
Example 3: Multiple Endpoints

Request to basic endpoint (/api/data)...
✔ Basic endpoint accessed
   Cost: 0.01 USDC
   Data: {"method":"GET","path":"/api/data","data":{"message":"Your data here"}}

Request to premium endpoint (/api/premium)...
✔ Premium endpoint accessed
   Cost: 0.10 USDC
   Data: {"data":"This is premium content!","timestamp":1699564800000}

✔ Summary:
   Total spent: 0.11 USDC
   Requests made: 2
   All payments verified on-chain ✔
```

## Use Cases

### API Pricing Tiers

```typescript
async function testPricingTiers() {
  const tiers = [
    { name: "Basic", url: "/api/basic", price: "0.01" },
    { name: "Pro", url: "/api/pro", price: "0.05" },
    { name: "Premium", url: "/api/premium", price: "0.10" },
    { name: "Enterprise", url: "/api/enterprise", price: "1.00" },
  ];

  for (const tier of tiers) {
    const response = await x402(`http://localhost:4402${tier.url}`)
      .withPayment(tier.price)
      .execute();

    console.log(`${tier.name}: ${JSON.stringify(response.body)}`);
  }
}
```

### Sequential Requests

```typescript
async function sequentialRequests() {
  // Request 1: Get data
  const data = await x402("http://localhost:4402/api/data")
    .withPayment("0.01")
    .execute();

  // Request 2: Process with premium service
  const result = await x402("http://localhost:4402/api/process")
    .post({ data: data.body })
    .withPayment("0.10")
    .execute();

  // Request 3: Export results
  const exported = await x402("http://localhost:4402/api/export")
    .post({ result: result.body })
    .withPayment("0.05")
    .execute();

  return exported.body;
}
```

### Budget Management

```typescript
class BudgetManager {
  constructor(private maxBudget: number) {
    this.spent = 0;
  }

  private spent: number;

  async makeRequest(url: string, amount: string) {
    const cost = parseFloat(amount);

    if (this.spent + cost > this.maxBudget) {
      throw new Error(
        `Budget exceeded: ${this.spent + cost} > ${this.maxBudget}`
      );
    }

    const response = await x402(url).withPayment(amount).execute();

    this.spent += cost;
    console.log(
      `Spent: $${this.spent.toFixed(2)} / $${this.maxBudget.toFixed(2)}`
    );

    return response;
  }

  getRemainingBudget(): number {
    return this.maxBudget - this.spent;
  }
}

// Usage
const budget = new BudgetManager(1.0); // $1 budget

await budget.makeRequest("http://localhost:4402/api/data", "0.01");
await budget.makeRequest("http://localhost:4402/api/premium", "0.10");

console.log("Remaining:", budget.getRemainingBudget());
```

## Next Steps

- [Error Handling](/examples/error-handling) - Handle payment failures
- [AI Agent](/examples/ai-agent) - Autonomous agent example
