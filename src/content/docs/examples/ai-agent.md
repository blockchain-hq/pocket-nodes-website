---
title: AI Agent
description: Build an autonomous AI agent with budget management
---


An autonomous AI agent that makes payment-protected API calls with budget management.

## Code

```typescript
import { x402 } from "x402test";

class WeatherAgent {
  private budget: number;
  private spent: number = 0;

  constructor(budget: number) {
    this.budget = budget;
    console.log(`✔ Weather Agent initialized with budget: ${budget} USDC`);
  }

  async getWeather(city: string): Promise<any> {
    console.log(`\n✔ Agent: Fetching weather for ${city}...`);

    // Check budget before making payment
    const costPerRequest = 0.01;
    if (this.spent + costPerRequest > this.budget) {
      throw new Error("✘ Budget exceeded! Cannot make request.");
    }

    try {
      const response = await x402("http://localhost:4402/api/data")
        .withPayment({ amount: costPerRequest.toString() })
        .expectStatus(200)
        .execute();

      this.spent += costPerRequest;
      console.log(`✔ Agent: Weather data acquired`);
      console.log(`   Cost: ${costPerRequest} USDC`);
      console.log(
        `   Budget remaining: ${(this.budget - this.spent).toFixed(2)} USDC`
      );

      return response.body;
    } catch (error) {
      console.error(`✘ Agent: Failed to get weather data`);
      throw error;
    }
  }

  async analyzeWeekTrends(cities: string[]): Promise<void> {
    console.log(
      `\n✔ Agent: Analyzing weather trends for ${cities.length} cities...`
    );

    const results: { city: string; data: any }[] = [];

    for (const city of cities) {
      try {
        const data = await this.getWeather(city);
        results.push({ city, data });
      } catch (error) {
        console.log(`   Skipping ${city} due to error`);
      }
    }

    console.log(`\n✔ Agent: Analysis complete`);
    console.log(`   Cities analyzed: ${results.length}`);
    console.log(`   Total spent: ${this.spent.toFixed(2)} USDC`);
    console.log(
      `   Average cost per city: ${(this.spent / results.length).toFixed(
        4
      )} USDC`
    );
  }

  reportBudget() {
    console.log(`\n✔ Budget Report:`);
    console.log(`   Initial: ${this.budget} USDC`);
    console.log(`   Spent: ${this.spent.toFixed(2)} USDC`);
    console.log(`   Remaining: ${(this.budget - this.spent).toFixed(2)} USDC`);
    console.log(
      `   Utilization: ${((this.spent / this.budget) * 100).toFixed(1)}%`
    );
  }
}

// Run the agent
async function main() {
  console.log("✔ Example: Autonomous Weather Agent\n");

  const agent = new WeatherAgent(0.5); // 50 cents budget

  await agent.analyzeWeekTrends([
    "San Francisco",
    "New York",
    "London",
    "Tokyo",
    "Sydney",
  ]);

  agent.reportBudget();
}

main();
```

## Output

```
✔ Example: Autonomous Weather Agent

✔ Weather Agent initialized with budget: 0.5 USDC

✔ Agent: Analyzing weather trends for 5 cities...

✔ Agent: Fetching weather for San Francisco...
✔ Agent: Weather data acquired
   Cost: 0.01 USDC
   Budget remaining: 0.49 USDC

✔ Agent: Fetching weather for New York...
✔ Agent: Weather data acquired
   Cost: 0.01 USDC
   Budget remaining: 0.48 USDC

✔ Agent: Fetching weather for London...
✔ Agent: Weather data acquired
   Cost: 0.01 USDC
   Budget remaining: 0.47 USDC

✔ Agent: Fetching weather for Tokyo...
✔ Agent: Weather data acquired
   Cost: 0.01 USDC
   Budget remaining: 0.46 USDC

✔ Agent: Fetching weather for Sydney...
✔ Agent: Weather data acquired
   Cost: 0.01 USDC
   Budget remaining: 0.45 USDC

✔ Agent: Analysis complete
   Cities analyzed: 5
   Total spent: 0.05 USDC
   Average cost per city: 0.0100 USDC

✔ Budget Report:
   Initial: 0.5 USDC
   Spent: 0.05 USDC
   Remaining: 0.45 USDC
   Utilization: 10.0%
```

## Key Features

### Budget Management

The agent tracks spending and prevents budget overruns:

```typescript
if (this.spent + costPerRequest > this.budget) {
  throw new Error("Budget exceeded!");
}
```

### Autonomous Decision Making

The agent decides which requests to make based on budget:

```typescript
async function intelligentAgent() {
  const agent = new SmartAgent(1.0); // $1 budget

  // Prioritize requests
  const tasks = [
    { name: "Critical data", cost: 0.1, priority: 1 },
    { name: "Nice to have", cost: 0.5, priority: 2 },
    { name: "Optional", cost: 0.2, priority: 3 },
  ];

  // Sort by priority
  tasks.sort((a, b) => a.priority - b.priority);

  for (const task of tasks) {
    if (agent.canAfford(task.cost)) {
      await agent.execute(task);
    }
  }
}
```

### Error Resilience

The agent continues operating despite individual failures:

```typescript
for (const city of cities) {
  try {
    const data = await this.getWeather(city);
    results.push({ city, data });
  } catch (error) {
    console.log(`Skipping ${city} due to error`);
    // Continue with next city
  }
}
```

## Advanced Agent

```typescript
class AdvancedAgent {
  constructor(
    private budget: number,
    private maxCostPerRequest: number = 0.1
  ) {}

  private spent = 0;
  private requestCount = 0;
  private successCount = 0;

  async makeRequest(url: string, price: string): Promise<any> {
    const cost = parseFloat(price);

    // Budget check
    if (this.spent + cost > this.budget) {
      throw new Error("Budget exceeded");
    }

    // Cost limit check
    if (cost > this.maxCostPerRequest) {
      console.log(
        `Skipping expensive request: ${cost} > ${this.maxCostPerRequest}`
      );
      return null;
    }

    this.requestCount++;

    try {
      const response = await x402(url)
        .withPayment(price)
        .expectStatus(200)
        .execute();

      this.spent += cost;
      this.successCount++;

      return response.body;
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      return null;
    }
  }

  getStats() {
    return {
      budget: this.budget,
      spent: this.spent,
      remaining: this.budget - this.spent,
      requestCount: this.requestCount,
      successCount: this.successCount,
      successRate:
        this.requestCount > 0
          ? (this.successCount / this.requestCount) * 100
          : 0,
      averageCost: this.successCount > 0 ? this.spent / this.successCount : 0,
    };
  }
}
```

## Next Steps

- [Advanced Configuration](/advanced/configuration) - Configure agents
- [Replay Protection](/advanced/replay-protection) - Security
