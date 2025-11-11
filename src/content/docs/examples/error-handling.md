---
title: Error Handling
description: Gracefully handle payment errors in your n8n workflows
---

Learn how to handle common errors when making x402 payments in n8n workflows, ensuring your automations are robust and reliable.

## Common Error Scenarios

### 1. Insufficient Balance

### 2. Payment Exceeds Limit

### 3. Network/RPC Errors

### 4. API Unavailable

### 5. Payment Rejected

## Basic Error Handling Workflow

```
[Trigger]
    ↓
[x402 Wallet Manager]
    ↓
[x402 Client]
  - Settings: "Continue On Fail" = ON
    ↓
[IF Node] Check for errors
    ├─ Success Path → Process Data
    └─ Error Path → Handle Error → Send Alert
```

## Implementation

### Step 1: Enable "Continue On Fail"

1. Click on **x402 Client node**
2. Click **Settings** tab
3. Enable **"Continue On Fail"**
4. This prevents workflow from stopping on errors

### Step 2: Add Error Detection

Add an **IF node** after the Client:

**Condition**:

```javascript
{
  {
    $json.error !== undefined;
  }
}
```

This checks if an error occurred.

### Step 3: Handle Errors Appropriately

**Success Path** (Error = false):

```
[Process Data Node]
  - Extract {{$json.data}}
  - Continue workflow
```

**Error Path** (Error = true):

```
[Error Handler Node]
  - Log error
  - Send notification
  - Retry or fail gracefully
```

## Detailed Error Handling

### Insufficient Balance Error

**Error Message**:

```
Insufficient balance!
Wallet: 9rKnvE7PVbpq4...
USDC: 0
SOL: 0.5
Get USDC: https://spl-token-faucet.com/?token-name=USDC-Dev
```

**Handling Strategy**:

```javascript
// In Code node (Error path)
const error = $json.error;

if (error && error.includes("Insufficient balance")) {
  // Send alert to admin
  return {
    json: {
      action: "alert_admin",
      message: "Workflow wallet needs funding",
      walletAddress: $json.walletAddress,
      requiredAmount: "0.01 USDC",
      fundingUrl: "https://spl-token-faucet.com/?token-name=USDC-Dev",
    },
  };
}
```

### Payment Exceeds Limit Error

**Error Message**:

```
Payment required (0.50 USDC) exceeds max payment limit (0.10 USDC)
```

**Handling Strategy**:

```javascript
if (error && error.includes("exceeds max payment limit")) {
  // Log and skip this request
  return {
    json: {
      action: "skip",
      reason: "Payment too expensive",
      requestedAmount: "0.50 USDC",
      maxAllowed: "0.10 USDC",
      recommendation: "Increase max payment limit or use different API",
    },
  };
}
```

### Network/RPC Error

**Error Message**:

```
Could not fetch USDC balance: RPC error
Continuing - will attempt payment anyway
```

**Handling Strategy**:

```javascript
if (error && error.includes("RPC error")) {
  // Retry after delay
  return {
    json: {
      action: "retry",
      delaySeconds: 30,
      reason: "RPC node temporarily unavailable",
      retryCount: $json.retryCount + 1 || 1,
    },
  };
}
```

## Complete Error Handling Workflow

### Workflow Structure

```
[Schedule Trigger] Every hour
    ↓
[x402 Wallet Manager]
  - Continue On Fail: ON
    ↓
[IF] Wallet loaded?
    ├─ NO → [Send Alert] "Wallet error"
    └─ YES ↓
            [x402 Client]
              - Continue On Fail: ON
                ↓
            [IF] Payment successful?
                ├─ YES → [Process Data]
                └─ NO → [Error Handler]
                          ↓
                        [IF] Error type?
                          ├─ Balance → [Fund Alert]
                          ├─ Limit → [Log Skip]
                          ├─ Network → [Retry Logic]
                          └─ Other → [Log Error]
```

### Error Handler Code Node

```javascript
const error = $json.error || "";
const node = $json.node || "";

// Categorize error
let errorType = "unknown";
let action = "log";
let retryable = false;

if (error.includes("Insufficient balance")) {
  errorType = "balance";
  action = "alert_admin";
  retryable = false;
} else if (error.includes("exceeds max payment")) {
  errorType = "limit";
  action = "skip";
  retryable = false;
} else if (error.includes("RPC") || error.includes("network")) {
  errorType = "network";
  action = "retry";
  retryable = true;
} else if (error.includes("Transaction not found")) {
  errorType = "timing";
  action = "retry";
  retryable = true;
} else if (error.includes("Payment rejected")) {
  errorType = "payment";
  action = "log";
  retryable = false;
}

return {
  json: {
    errorType,
    action,
    retryable,
    originalError: error,
    node,
    timestamp: new Date().toISOString(),

    // Action-specific data
    ...(action === "alert_admin" && {
      alertMessage: "Wallet needs funding",
      fundingUrl: "https://spl-token-faucet.com",
    }),

    ...(action === "retry" && {
      retryAfterSeconds: 30,
      maxRetries: 3,
    }),
  },
};
```

## Retry Logic

### Simple Retry with Wait

```
[x402 Client] (attempt 1)
    ↓ ERROR
[Wait Node] 30 seconds
    ↓
[x402 Client] (attempt 2)
    ↓ ERROR
[Wait Node] 60 seconds
    ↓
[x402 Client] (attempt 3)
    ↓ ERROR
[Send Alert] "Failed after 3 attempts"
```

### Smart Retry with Counter

Use workflow static data to track retries:

```javascript
// In Code node before retry
const staticData = $getWorkflowStaticData("global");
const retryKey = `retry_${$json.requestId}`;

// Get current retry count
const retryCount = staticData[retryKey] || 0;

if (retryCount >= 3) {
  // Max retries reached
  delete staticData[retryKey];
  return {
    json: {
      action: "fail",
      reason: "Max retries exceeded",
      attempts: retryCount,
    },
  };
}

// Increment retry count
staticData[retryKey] = retryCount + 1;

return {
  json: {
    action: "retry",
    attemptNumber: retryCount + 1,
    waitSeconds: Math.pow(2, retryCount) * 10, // Exponential backoff
  },
};
```

## Monitoring and Alerts

### Send Email Alert

```
[Error Handler]
    ↓
[Send Email Node]
  To: admin@company.com
  Subject: "x402 Payment Error - {{$json.errorType}}"
  Body:
    Error occurred in workflow: {{$workflow.name}}
    Type: {{$json.errorType}}
    Message: {{$json.originalError}}
    Time: {{$json.timestamp}}
    Action needed: {{$json.action}}
```

### Send Slack Notification

```
[Error Handler]
    ↓
[Slack Node]
  Channel: #alerts
  Message:
    🚨 x402 Payment Error
    Workflow: {{$workflow.name}}
    Error: {{$json.errorType}}
    Details: {{$json.originalError}}
    {{$json.alertMessage}}
```

### Log to Database

```
[Error Handler]
    ↓
[Postgres Node]
  Operation: Insert
  Table: payment_errors
  Columns:
    - workflow_id: {{$workflow.id}}
    - error_type: {{$json.errorType}}
    - error_message: {{$json.originalError}}
    - timestamp: {{$json.timestamp}}
    - retryable: {{$json.retryable}}
```

## Best Practices

### 1. Always Enable "Continue On Fail"

For production workflows:

- **Wallet Manager**: Continue On Fail = ON
- **x402 Client**: Continue On Fail = ON
- **Error Handler**: Continue On Fail = OFF (fail if handler breaks)

### 2. Set Appropriate Payment Limits

```
Development: Max Payment = 0.10 USDC
Production: Max Payment = 1.00 USDC
Critical APIs: Max Payment = 5.00 USDC
```

### 3. Monitor Wallet Balance

Add a balance check node:

```javascript
const balance = $json.balances.usdc;
const minBalance = 1.0; // Minimum 1 USDC

if (balance < minBalance) {
  // Send warning
  return {
    json: {
      warning: true,
      message: `Low balance: ${balance} USDC`,
      recommendedAction: "Fund wallet soon",
    },
  };
}
```

### 4. Log All Payment Attempts

```javascript
// In Code node after Client
const logEntry = {
  timestamp: new Date().toISOString(),
  workflowId: $workflow.id,
  success: !$json.error,
  amount: $json._x402Payment?.amount,
  error: $json.error,
  apiUrl: $node["x402 Client"].parameters.resourceUrl,
};

// Send to logging service or database
return { json: logEntry };
```

### 5. Implement Circuit Breaker

Stop trying after too many failures:

```javascript
const staticData = $getWorkflowStaticData("global");
const failureCount = staticData.recentFailures || 0;

if (failureCount >= 5) {
  // Circuit breaker open - don't try payment
  return {
    json: {
      circuitBreakerOpen: true,
      message: "Too many recent failures. Pausing payments.",
      action: "manual_review_required",
    },
  };
}

// Continue with payment...
```

## Testing Error Scenarios

### Test Insufficient Balance

1. Check wallet balance
2. Set Mock Server amount higher than balance
3. Run workflow
4. Verify error handling works

### Test Exceeded Limit

1. Set Mock Server amount: 500000 (0.50 USDC)
2. Set Client max: 0.10 USDC
3. Run workflow
4. Verify error caught and handled

### Test Network Error

1. Temporarily disable internet
2. Run workflow
3. Verify retry logic activates
4. Re-enable internet
5. Verify retry succeeds

## Example: Production-Ready Workflow

```javascript
// Complete error-handling workflow
{
  "name": "Production x402 Payment with Error Handling",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": { "rule": { "interval": [{ "field": "hours", "hoursInterval": 1 }] } }
    },
    {
      "name": "x402 Wallet Manager",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402WalletManager",
      "parameters": { "network": "solana-devnet" },
      "continueOnFail": true
    },
    {
      "name": "Check Wallet Loaded",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [{ "value1": "={{$json.ready}}", "value2": true }]
        }
      }
    },
    {
      "name": "x402 Client",
      "type": "@blockchain-hq/n8n-nodes-x402-pocket.x402Client",
      "parameters": {
        "resourceUrl": "https://api.example.com/data",
        "autoPay": true,
        "maxPayment": 1
      },
      "continueOnFail": true
    },
    {
      "name": "Check Success",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [{ "value1": "={{$json.error === undefined}}", "value2": true }]
        }
      }
    },
    {
      "name": "Process Data",
      "type": "n8n-nodes-base.code"
    },
    {
      "name": "Error Handler",
      "type": "n8n-nodes-base.code"
    },
    {
      "name": "Send Alert",
      "type": "n8n-nodes-base.emailSend"
    }
  ]
}
```

## What's Next?

- [Multiple Endpoints](/examples/multiple-endpoints/) - Call several APIs
- [AI Agent](/examples/ai-agent/) - Autonomous payment workflows
- [Advanced Configuration](/advanced/configuration/) - Fine-tune settings

---

**With proper error handling, your x402 workflows will be production-ready!** 🛡️
