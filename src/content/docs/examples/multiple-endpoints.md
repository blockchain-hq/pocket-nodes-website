---
title: Multiple Endpoints
description: Call multiple x402-enabled APIs in a single workflow
---

Learn how to efficiently call multiple x402-enabled APIs from a single n8n workflow, managing payments for each endpoint.

## Overview

Many workflows need to call multiple paid APIs:

- Different data sources
- Multiple processing steps
- Aggregated results
- Backup/fallback APIs

x402 Pocket Nodes makes this straightforward with wallet reuse across multiple Client nodes.

## Basic Pattern

### Sequential Calls

```
[Manual Trigger]
    ↓
[x402 Wallet Manager]
  - Network: Devnet
    ↓
[x402 Client 1] Get Weather Data (0.01 USDC)
    ↓
[x402 Client 2] Get News Data (0.02 USDC)
    ↓
[x402 Client 3] Get Analytics (0.05 USDC)
    ↓
[Merge Results]
  - Total spent: 0.08 USDC
```

### Parallel Calls

```
[Manual Trigger]
    ↓
[x402 Wallet Manager]
    ├→ [x402 Client 1] API A (0.01 USDC)
    ├→ [x402 Client 2] API B (0.02 USDC)
    └→ [x402 Client 3] API C (0.05 USDC)
         ↓
    [Merge Node]
  - All three execute simultaneously
  - Total: 0.08 USDC from same wallet
```

## Real-World Example: Data Aggregation

### Scenario

Aggregate data from multiple sources:

- Market data (0.01 USDC)
- News sentiment (0.02 USDC)
- AI analysis (0.10 USDC)

Total cost: 0.13 USDC per execution

### Workflow Setup

```
[Schedule Trigger] Every hour
    ↓
[x402 Wallet Manager]
  - Network: Devnet
  - Action: Check Balance
    ↓
[IF] Balance > 0.20?
    ├─ NO → [Send Alert] "Low balance: {balance}"
    └─ YES ↓
            ├→ [x402 Client: Market]
            │   - URL: https://market-api.com/data
            │   - Max Payment: 0.05
            ├→ [x402 Client: News]
            │   - URL: https://news-api.com/sentiment
            │   - Max Payment: 0.05
            └→ [x402 Client: AI]
                - URL: https://ai-api.com/analyze
                - Max Payment: 0.15
                 ↓
            [Merge] Combine all three responses
                 ↓
            [Code] Process aggregated data
                 ↓
            [Database] Store results
```

### Configuration

**Wallet Manager**:

```
Network: solana-devnet
Action: Check Balance
Continue On Fail: ON
```

**Client: Market Data**:

```
Wallet Source: From Wallet Manager Node
Resource URL: https://market-api.com/data
Method: GET
Auto-Pay: true
Max Payment: 0.05
```

**Client: News Sentiment**:

```
Wallet Source: From Wallet Manager Node
Resource URL: https://news-api.com/sentiment
Method: POST
Body: {"topics": ["crypto", "stocks"]}
Auto-Pay: true
Max Payment: 0.05
```

**Client: AI Analysis**:

```
Wallet Source: From Wallet Manager Node
Resource URL: https://ai-api.com/analyze
Method: POST
Body: {"data": "{{$json}}"}
Auto-Pay: true
Max Payment: 0.15
```

### Merge Node

```javascript
// Combine data from all three APIs
const marketData = $node["x402 Client: Market"].json;
const newsData = $node["x402 Client: News"].json;
const aiData = $node["x402 Client: AI"].json;

return {
  json: {
    market: marketData.data,
    news: newsData.sentiment,
    ai: aiData.analysis,
    totalPaid: (
      parseFloat(marketData._x402Payment?.amount || 0) +
      parseFloat(newsData._x402Payment?.amount || 0) +
      parseFloat(aiData._x402Payment?.amount || 0)
    ).toFixed(2),
    timestamp: new Date().toISOString(),
  },
};
```

## Error Handling for Multiple Endpoints

### Continue on Partial Failure

```
[x402 Client 1] Continue On Fail: ON
    ↓
[x402 Client 2] Continue On Fail: ON
    ↓
[x402 Client 3] Continue On Fail: ON
    ↓
[Code] Check which succeeded
    ├→ [All Success] Full data processing
    ├→ [Partial Success] Partial data processing
    └→ [All Failed] Error handling
```

### Validation Code

```javascript
// Check which APIs succeeded
const results = [
  {
    name: "Market",
    data: $node["Client 1"].json,
    error: $node["Client 1"].json.error,
  },
  {
    name: "News",
    data: $node["Client 2"].json,
    error: $node["Client 2"].json.error,
  },
  {
    name: "AI",
    data: $node["Client 3"].json,
    error: $node["Client 3"].json.error,
  },
];

const successful = results.filter((r) => !r.error);
const failed = results.filter((r) => r.error);

return {
  json: {
    successCount: successful.length,
    failureCount: failed.length,
    successful: successful.map((r) => r.name),
    failed: failed.map((r) => ({ name: r.name, error: r.error })),
    hasAllData: successful.length === 3,
    hasPartialData: successful.length > 0 && successful.length < 3,
    hasNoData: successful.length === 0,
  },
};
```

## Fallback APIs

### Primary + Backup Pattern

```
[x402 Client: Primary API]
  Continue On Fail: ON
    ↓
[IF] Primary failed?
    ├─ YES → [x402 Client: Backup API]
    │         - Different provider
    │         - Maybe more expensive
    └─ NO → [Use Primary Data]
```

### Implementation

```javascript
// In IF node after Primary API
{
  {
    $json.error !== undefined;
  }
}

// If true (error exists), go to backup
// If false (no error), use primary data
```

## Cost Optimization

### Smart Endpoint Selection

```javascript
// Choose endpoint based on cost vs. quality needs
const urgencyLevel = $json.urgency; // high, medium, low

let endpoint, maxPayment;

if (urgencyLevel === "high") {
  endpoint = "https://premium-api.com/fast"; // 0.25 USDC
  maxPayment = 0.3;
} else if (urgencyLevel === "medium") {
  endpoint = "https://standard-api.com/data"; // 0.05 USDC
  maxPayment = 0.1;
} else {
  endpoint = "https://economy-api.com/data"; // 0.01 USDC
  maxPayment = 0.02;
}

return {
  json: {
    apiUrl: endpoint,
    maxPayment: maxPayment,
  },
};
```

### Caching Results

```javascript
// Cache expensive API results
const staticData = $getWorkflowStaticData("global");
const cacheKey = `cache_${apiEndpoint}_${queryHash}`;
const cached = staticData[cacheKey];

if (cached && Date.now() - cached.timestamp < 3600000) {
  // 1 hour
  // Use cached data, no payment needed
  return { json: cached.data };
}

// Make payment and cache result
// (after x402 Client executes)
staticData[cacheKey] = {
  data: $json,
  timestamp: Date.now(),
};
```

## Batching Requests

### Collect Then Process

```
[Schedule Trigger] Every 15 minutes
    ↓
[Get Pending Items] From database
    ↓
[Split In Batches] 10 items per batch
    ↓
[Loop Over Batches]
    ├→ [x402 Client] Process batch (0.10 USDC)
    │   ↓
    └─ [Next Batch]
         ↓
    [All Complete]
```

### Batch Configuration

```javascript
// In Code node before loop
const items = $json.items; // Array of items to process
const batchSize = 10;
const batches = [];

for (let i = 0; i < items.length; i += batchSize) {
  batches.push(items.slice(i, i + batchSize));
}

return batches.map((batch) => ({ json: { items: batch } }));
```

## Mixed Free and Paid

### Combine Both Types

```
[Trigger]
    ↓
[HTTP Request] Free public API
  - URL: https://api.free.com/data
  - No payment needed
    ↓
[IF] Need premium data?
    ├─ YES → [x402 Client] Paid premium API
    │         - URL: https://api.paid.com/premium
    │         - 0.05 USDC
    └─ NO → [Skip premium]
         ↓
    [Merge Free + Paid Data]
```

### Cost-Aware Routing

```javascript
// Route to free API when possible
const dataNeeded = $json.dataType;
const budgetRemaining = $json.budgetRemaining;

if (dataNeeded === "basic") {
  // Use free API
  return {
    json: {
      useApi: "free",
      url: "https://free-api.com/basic",
    },
  };
} else if (budgetRemaining >= 0.1) {
  // Can afford premium
  return {
    json: {
      useApi: "premium",
      url: "https://paid-api.com/premium",
      maxPayment: 0.1,
    },
  };
} else {
  // Budget constrained
  return {
    json: {
      useApi: "free",
      url: "https://free-api.com/advanced",
      note: "Using free tier due to budget",
    },
  };
}
```

## Transaction Tracking

### Track All Payments

```javascript
// After all Client nodes complete
const payments = [];

for (const nodeName of ["Client 1", "Client 2", "Client 3"]) {
  const nodeOutput = $node[nodeName].json;
  if (nodeOutput._x402Payment) {
    payments.push({
      node: nodeName,
      amount: nodeOutput._x402Payment.amount,
      recipient: nodeOutput._x402Payment.recipient,
      timestamp: nodeOutput._x402Payment.timestamp,
    });
  }
}

const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

return {
  json: {
    payments: payments,
    totalPayments: payments.length,
    totalSpent: totalSpent.toFixed(2),
    currency: "USDC",
  },
};
```

### Log to Database

```
[After Merge]
    ↓
[Code] Calculate totals (above)
    ↓
[Postgres]
  - INSERT INTO payment_logs
  - Columns: workflow_id, execution_id, total_spent, payments_json, timestamp
```

## Complete Example Workflow

Here's a complete multi-endpoint workflow JSON:

```json
{
  "name": "Multi-API Data Aggregation",
  "nodes": [
    {
      "parameters": {},
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "parameters": {
        "network": "solana-devnet",
        "action": "balance"
      },
      "name": "x402 Wallet Manager",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402WalletManager",
      "continueOnFail": true
    },
    {
      "parameters": {
        "walletSource": "external",
        "resourceUrl": "http://localhost:3000/api/premium/data",
        "method": "GET",
        "autoPay": true,
        "maxPayment": 0.05
      },
      "name": "Get Market Data",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402Client",
      "continueOnFail": true
    },
    {
      "parameters": {
        "walletSource": "external",
        "resourceUrl": "http://localhost:3000/api/premium/analytics",
        "method": "GET",
        "autoPay": true,
        "maxPayment": 0.1
      },
      "name": "Get Analytics",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402Client",
      "continueOnFail": true
    },
    {
      "parameters": {
        "jsCode": "// Merge results code here"
      },
      "name": "Merge Results",
      "type": "n8n-nodes-base.code"
    }
  ]
}
```

## What's Next?

- [AI Agent Example](/examples/ai-agent/) - Autonomous payments
- [Error Handling](/examples/error-handling/) - Handle failures
- [Advanced Configuration](/advanced/configuration/) - Production setup
- [Custom Validation](/advanced/custom-validation/) - Add validation logic
