---
title: AI Agent Workflow
description: Build autonomous AI agents with automatic payment capabilities
---

Learn how to build autonomous AI agents in n8n that can make payment-protected API calls automatically, perfect for AI workflows that need premium data or services.

## Overview

AI agents often need to:

- Access premium AI APIs (GPT-4, Claude, etc.)
- Call specialized data services
- Process expensive computations
- Aggregate multiple paid sources

x402 Pocket Nodes enables AI agents to make these payments automatically within their budget constraints.

## Basic AI Agent Pattern

```
[Schedule Trigger] Every hour
    ↓
[x402 Wallet Manager]
  - Provides wallet
    ↓
[AI Decision Node]
  - Analyzes situation
  - Decides if premium data needed
    ↓
[IF] Need premium analysis?
    ├─ YES → [x402 Client] Call AI API (0.10 USDC)
    │         ↓
    │        [Process AI Results]
    └─ NO → [Use Basic Logic]
```

## Example: Autonomous Market Analysis Agent

### Goal

Agent that:

- Monitors market every hour
- Decides if detailed analysis is needed
- Automatically pays for premium AI analysis
- Stays within daily budget

### Workflow

```
[Schedule Trigger] Every 1 hour
    ↓
[HTTP Request] Get free market overview
  - URL: https://free-market-api.com/overview
    ↓
[Code] Analyze if deep dive needed
    ↓
[IF] Significant market movement?
    ├─ NO → [Log] "No action needed"
    └─ YES ↓
            [x402 Wallet Manager]
              - Check balance
                ↓
            [IF] Balance > 0.15 USDC?
                ├─ NO → [Alert] "Low balance"
                └─ YES ↓
                        [x402 Client] AI Analysis
                          - URL: https://ai-api.com/analyze
                          - Method: POST
                          - Body: {"market": "{{$json.marketData}}"}
                          - Max Payment: 0.10
                            ↓
                        [Code] Process AI insights
                            ↓
                        [Decision] Take action?
                            ├─ YES → [Execute Trade/Alert]
                            └─ NO → [Log Analysis]
```

### Decision Logic

```javascript
// In "Analyze if deep dive needed" node
const marketData = $json;
const priceChange = Math.abs(marketData.changePercent);
const volumeChange = Math.abs(marketData.volumeChangePercent);

// Trigger deep analysis if significant movement
if (priceChange > 5 || volumeChange > 20) {
  return {
    json: {
      needsAnalysis: true,
      reason: `Price: ${priceChange}%, Volume: ${volumeChange}%`,
      marketData: marketData,
    },
  };
}

return {
  json: {
    needsAnalysis: false,
    reason: "Market stable",
  },
};
```

### Budget Management

```javascript
// Check daily budget
const staticData = $getWorkflowStaticData("global");
const today = new Date().toISOString().split("T")[0];
const spentKey = `ai_spent_${today}`;

const spentToday = staticData[spentKey] || 0;
const dailyBudget = 2.0; // 2 USDC per day
const costPerCall = 0.1;

if (spentToday + costPerCall > dailyBudget) {
  return {
    json: {
      error: "Daily budget exceeded",
      spent: spentToday,
      budget: dailyBudget,
      action: "skip_ai_call",
    },
  };
}

// Track spending after call succeeds
// (in node after x402 Client)
if ($json._x402Payment) {
  staticData[spentKey] = spentToday + parseFloat($json._x402Payment.amount);
}
```

## Example: Multi-Step AI Pipeline

### Scenario

AI pipeline with multiple stages:

1. Content extraction (free)
2. Initial analysis (0.02 USDC)
3. Deep analysis if needed (0.10 USDC)
4. Image generation if needed (0.25 USDC)

### Workflow

```
[Webhook Trigger] User request
    ↓
[HTTP Request] Extract content (free)
    ↓
[x402 Wallet Manager]
    ↓
[x402 Client] Basic AI analysis
  - URL: https://ai-api.com/analyze/basic
  - Max Payment: 0.05
  - Body: {"text": "{{$json.content}}"}
    ↓
[IF] Complex topic detected?
    ├─ YES → [x402 Client] Deep analysis
    │         - URL: https://ai-api.com/analyze/deep
    │         - Max Payment: 0.15
    │         - Body: {"text": "{{$json.content}}", "mode": "deep"}
    │           ↓
    │        [IF] Image requested?
    │            ├─ YES → [x402 Client] Generate image
    │            │         - URL: https://ai-api.com/generate/image
    │            │         - Max Payment: 0.30
    │            └─ NO → [Skip image]
    └─ NO → [Use basic analysis]
         ↓
    [Format Response]
```

### Progressive Enhancement

```javascript
// Start with cheap, upgrade if needed
const content = $json.content;
const basicAnalysis = $node["Basic Analysis"].json;

// Check if basic analysis is sufficient
const confidence = basicAnalysis.confidence || 0;
const complexity = basicAnalysis.complexity || 0;

if (confidence > 0.8 && complexity < 0.5) {
  // Basic analysis is good enough
  return {
    json: {
      result: basicAnalysis,
      cost: $json._x402Payment.amount,
      tier: "basic",
    },
  };
}

// Need deep analysis
return {
  json: {
    needsDeepAnalysis: true,
    reason: `Low confidence: ${confidence}, High complexity: ${complexity}`,
    basicResult: basicAnalysis,
  },
};
```

## Cost Tracking

### Agent Spending Report

```
[Schedule Trigger] Daily at midnight
    ↓
[Code] Get yesterday's spending
    ↓
[Format Report]
    ↓
[Send Email] Daily AI Agent Report
```

**Report Code**:

```javascript
const staticData = $getWorkflowStaticData("global");
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const spentKey = `ai_spent_${yesterday}`;

const spending = staticData[spentKey] || 0;

return {
  json: {
    date: yesterday,
    totalSpent: spending,
    currency: "USDC",
    callsEstimate: Math.floor(spending / 0.1), // Assuming 0.10 per call
    report: `AI Agent spent ${spending} USDC on ${yesterday}`,
  },
};
```

## Example: Autonomous Research Agent

### Goal

Agent that researches topics and compiles reports:

- Gets topic from input
- Searches free sources
- If insufficient, uses paid APIs
- Generates comprehensive report
- Stays within budget

### Implementation

```
[Manual Trigger] Research request
    ↓
[Set] topic = "quantum computing"
    ↓
[HTTP Request] Free search engine
    ↓
[Code] Evaluate results quality
    ↓
[IF] Quality < 70%?
    ├─ YES → [x402 Wallet Manager]
    │         ↓
    │        [x402 Client] Academic database (0.05 USDC)
    │         ↓
    │        [IF] Still insufficient?
    │            ├─ YES → [x402 Client] Premium research API (0.20 USDC)
    │            └─ NO → [Compile Report]
    └─ NO → [Compile Report]
         ↓
    [x402 Client] AI summarization (0.10 USDC)
    - Input: All collected data
    - Output: Comprehensive report
         ↓
    [Return Report]
```

### Quality Check

```javascript
// Evaluate if free sources are sufficient
const searchResults = $json.results;

const qualityMetrics = {
  resultCount: searchResults.length,
  avgRelevance:
    searchResults.reduce((s, r) => s + r.relevance, 0) / searchResults.length,
  hasAcademicSources: searchResults.some((r) => r.source === "academic"),
  recency: searchResults.filter(
    (r) => new Date(r.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  ).length,
};

const qualityScore =
  (qualityMetrics.resultCount >= 10 ? 25 : qualityMetrics.resultCount * 2.5) +
  qualityMetrics.avgRelevance * 50 +
  (qualityMetrics.hasAcademicSources ? 15 : 0) +
  (qualityMetrics.recency / searchResults.length) * 10;

return {
  json: {
    quality: qualityScore,
    needsPremium: qualityScore < 70,
    metrics: qualityMetrics,
  },
};
```

## Best Practices for AI Agents

### 1. Always Set Budget Limits

```javascript
const dailyBudget = 5.0; // 5 USDC per day
const perCallLimit = 0.25; // 0.25 USDC per API call
```

### 2. Validate AI Responses

```javascript
// Don't blindly trust AI output
const aiResponse = $json.result;

if (!aiResponse.confidence || aiResponse.confidence < 0.7) {
  return {
    json: {
      warning: "Low confidence AI response",
      confidence: aiResponse.confidence,
      action: "manual_review",
    },
  };
}
```

### 3. Implement Fallbacks

Always have a plan B:

- Free API fallback
- Cached results
- Manual processing
- Simplified logic

### 4. Monitor Costs

```
[Every execution]
    ↓
[Log spending]
    ↓
[Check if over budget]
    ├─ YES → [Pause agent + alert]
    └─ NO → [Continue]
```

### 5. Test on Devnet First

```
Development: All on devnet (free)
Staging: Mix of devnet and small mainnet tests
Production: Mainnet with strict limits
```

## What's Next?

- [Error Handling](/examples/error-handling/) - Handle AI failures
- [Multiple Endpoints](/examples/multiple-endpoints/) - Call many APIs
- [Advanced Configuration](/advanced/configuration/) - Production setup
- [Custom Validation](/advanced/custom-validation/) - Validate AI output
