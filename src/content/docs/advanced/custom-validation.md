---
title: Custom Validation
description: Add custom validation logic to your x402 workflows
---

Learn how to add custom validation and business logic to your x402 payment workflows in n8n.

## Validation Scenarios

### Pre-Payment Validation

Validate before making payment:

```
[x402 Wallet Manager]
    ↓
[Validate Conditions]
  - Check balance
  - Check price
  - Check API availability
    ↓
[IF] All valid?
    ├─ YES → [x402 Client] Make payment
    └─ NO → [Skip] Log reason
```

### Post-Payment Validation

Validate after payment:

```
[x402 Client]
    ↓
[Validate Response]
  - Check data quality
  - Verify expected format
  - Validate business rules
    ↓
[IF] Valid?
    ├─ YES → [Process Data]
    └─ NO → [Log Issue] Payment made but data invalid
```

## Balance Validation

### Ensure Sufficient Balance

```javascript
// In Code node before Client
const balance = $json.balances.usdc;
const maxPayment = 0.1; // From Client config
const minimumBuffer = 0.5; // Safety buffer

if (balance < maxPayment + minimumBuffer) {
  return {
    json: {
      error: "Insufficient balance for payment + buffer",
      currentBalance: balance,
      required: maxPayment + minimumBuffer,
      action: "fund_wallet",
    },
  };
}

// Balance is sufficient - continue
return { json: { balanceOk: true } };
```

### Daily Spending Limit

```javascript
// Custom daily limit enforcement
const staticData = $getWorkflowStaticData("global");
const today = new Date().toISOString().split("T")[0];
const spendingKey = `daily_spending_${today}`;

const todaySpending = staticData[spendingKey] || 0;
const dailyLimit = 5.0; // 5 USDC per day

if (todaySpending >= dailyLimit) {
  throw new Error(`Daily limit reached: ${todaySpending}/${dailyLimit} USDC`);
}

// After Client node executes successfully
if ($json._x402Payment) {
  const paid = parseFloat($json._x402Payment.amount);
  staticData[spendingKey] = todaySpending + paid;
}
```

## Price Validation

### Check Price Before Paying

```javascript
// After receiving 402, before paying
// This requires modifying workflow to capture 402 response

const staticData = $getWorkflowStaticData("global");
const maxAcceptablePrice = 0.1;

// Simulated: If you could access 402 response
const requiredAmount = 0.15; // From 402 response

if (requiredAmount > maxAcceptablePrice) {
  return {
    json: {
      action: "price_too_high",
      required: requiredAmount,
      maximum: maxAcceptablePrice,
      decision: "skip_request",
    },
  };
}
```

**Note**: x402 Client checks this automatically with "Max Payment Amount" setting.

### Dynamic Price Limits

```javascript
// Set different limits based on user tier
const userTier = $json.userTier; // From previous node

let maxPayment;
switch (userTier) {
  case "free":
    maxPayment = 0.05;
    break;
  case "basic":
    maxPayment = 0.25;
    break;
  case "premium":
    maxPayment = 1.0;
    break;
  case "enterprise":
    maxPayment = 5.0;
    break;
  default:
    maxPayment = 0.1;
}

// Pass to Client node via dynamic config
// (requires using expressions in Client node settings)
```

## Response Validation

### Validate Data Quality

```javascript
// In Code node after x402 Client
const response = $json;

// Check response structure
if (!response.data || typeof response.data !== "object") {
  return {
    json: {
      error: "Invalid response structure",
      paidAmount: $json._x402Payment?.amount,
      action: "log_data_quality_issue",
    },
  };
}

// Check required fields
if (!response.data.results || response.data.results.length === 0) {
  return {
    json: {
      error: "Empty results from paid API",
      paidAmount: $json._x402Payment?.amount,
      action: "contact_api_support",
    },
  };
}

// Data is valid
return {
  json: {
    validated: true,
    data: response.data,
  },
};
```

### Validate Business Rules

```javascript
// Example: Validate AI response quality
const aiResponse = $json.result;
const paymentAmount = parseFloat($json._x402Payment.amount);

// For expensive calls, require minimum quality
if (paymentAmount >= 0.1) {
  const confidence = aiResponse.confidence || 0;
  const minConfidence = 0.85;

  if (confidence < minConfidence) {
    return {
      json: {
        error: "Low confidence result from expensive API",
        confidence: confidence,
        minimum: minConfidence,
        paidAmount: paymentAmount,
        action: "retry_or_refund",
      },
    };
  }
}

// Quality is acceptable
return { json: { qualityOk: true, data: aiResponse } };
```

## Conditional Payments

### Pay Only If Necessary

```
[Get Data from Free API]
    ↓
[IF] Data is insufficient?
    ├─ YES → [x402 Client] Get premium data
    └─ NO → [Use Free Data]
```

### Budget-Based Decisions

```
[Check Wallet Balance]
    ↓
[IF] Balance > 10 USDC?
    ├─ YES → [x402 Client] Use premium (expensive) API
    └─ NO → [x402 Client] Use standard (cheap) API
```

### Time-Based Limits

```javascript
// Only pay for premium data during business hours
const hour = new Date().getHours();
const isBusinessHours = hour >= 9 && hour < 17;

if (isBusinessHours) {
  // Use premium paid API
  return { json: { usePremium: true } };
} else {
  // Use free or cheaper API
  return { json: { usePremium: false } };
}
```

## Rate Limiting

### Prevent Excessive Spending

```javascript
// In Code node before Client
const staticData = $getWorkflowStaticData("global");
const hour = new Date().getHours();
const hourKey = `payments_hour_${hour}`;

const paymentsThisHour = staticData[hourKey] || 0;
const maxPaymentsPerHour = 10;

if (paymentsThisHour >= maxPaymentsPerHour) {
  throw new Error(
    `Hourly payment limit reached: ${paymentsThisHour}/${maxPaymentsPerHour}`
  );
}

// After successful payment
staticData[hourKey] = paymentsThisHour + 1;

// Cleanup old hours
const currentHour = new Date().getHours();
for (let h = 0; h < 24; h++) {
  if (h !== currentHour) {
    delete staticData[`payments_hour_${h}`];
  }
}
```

### Throttling

```javascript
// Limit to one payment per minute per endpoint
const lastPaymentKey = `last_payment_${apiEndpoint}`;
const lastPayment = staticData[lastPaymentKey];

if (lastPayment) {
  const timeSince = Date.now() - lastPayment;
  if (timeSince < 60000) {
    // 60 seconds
    throw new Error(`Throttled: wait ${60 - Math.floor(timeSince / 1000)}s`);
  }
}

// After payment
staticData[lastPaymentKey] = Date.now();
```

## Validation Workflows

### Complete Validation Flow

```
[Trigger]
    ↓
[Wallet Manager]
    ↓
[Validate Balance] > 1 USDC?
    ├─ NO → [Alert & Exit]
    └─ YES ↓
            [Check Daily Limit] < 5 USDC spent today?
                ├─ NO → [Alert & Exit]
                └─ YES ↓
                        [Check Rate Limit] < 10 requests/hour?
                            ├─ NO → [Throttle & Wait]
                            └─ YES ↓
                                    [x402 Client]
                                        ↓
                                    [Validate Response] Data quality OK?
                                        ├─ NO → [Log Issue]
                                        └─ YES ↓
                                                [Process Data]
```

## Wallet Validation

### Verify Wallet is Ready

```javascript
// From Wallet Manager output
const wallet = $json;

// Validate status
if (!wallet.ready) {
  throw new Error(`Wallet not ready: ${wallet.status}`);
}

// Validate balance minimums
if (wallet.balances.usdc < 1.0) {
  throw new Error(`USDC too low: ${wallet.balances.usdc}`);
}

if (wallet.balances.sol < 0.01) {
  throw new Error(`SOL too low: ${wallet.balances.sol}`);
}

// Wallet is valid
return { json: { walletValid: true } };
```

### Network Validation

```javascript
// Ensure wallet and client on same network
const walletNetwork = $json.network; // From Wallet Manager
const expectedNetwork = "solana-devnet";

if (walletNetwork !== expectedNetwork) {
  throw new Error(
    `Network mismatch: wallet on ${walletNetwork}, expected ${expectedNetwork}`
  );
}
```

## API Response Validation

### Schema Validation

```javascript
// Validate response matches expected schema
const response = $json;

const schema = {
  status: "string",
  data: "object",
  timestamp: "string",
};

for (const [field, type] of Object.entries(schema)) {
  if (typeof response[field] !== type) {
    throw new Error(`Invalid response: ${field} should be ${type}`);
  }
}

// Schema valid
return { json: response };
```

### Content Validation

```javascript
// Validate API returned useful data
const results = $json.data.results;

if (!Array.isArray(results)) {
  throw new Error("Expected array of results");
}

if (results.length === 0) {
  throw new Error("Empty results from paid API");
}

// Check result quality
const avgConfidence =
  results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

if (avgConfidence < 0.7) {
  throw new Error(`Low quality results: ${avgConfidence} confidence`);
}
```

## Payment Metadata Validation

### Verify Payment Details

```javascript
// After Client node
const payment = $json._x402Payment;

if (!payment) {
  throw new Error("Payment metadata missing - was this a free endpoint?");
}

// Validate payment matches expectations
if (payment.currency !== "USDC") {
  throw new Error(`Wrong currency: ${payment.currency}`);
}

if (payment.network !== "solana-devnet") {
  throw new Error(`Wrong network: ${payment.network}`);
}

const maxExpected = 0.1;
if (parseFloat(payment.amount) > maxExpected) {
  throw new Error(
    `Payment higher than expected: ${payment.amount} > ${maxExpected}`
  );
}
```

## What's Next?

- [Configuration](/advanced/configuration/) - Advanced settings
- [Replay Protection](/advanced/replay-protection/) - Security details
- [Error Handling](/examples/error-handling/) - Handle validation failures
- [Examples](/examples/basic-payment/) - See validation in action
