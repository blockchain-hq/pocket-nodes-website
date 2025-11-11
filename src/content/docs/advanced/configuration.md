---
title: Advanced Configuration
description: Advanced configuration options for x402 Pocket Nodes
---

Learn about advanced configuration options and best practices for production use of x402 Pocket Nodes in n8n.

## Production Configuration

### Payment Limits

Configure spending limits based on environment:

**Development**:

```
Max Payment: 0.10 USDC
Rationale: Low risk, frequent testing
```

**Staging**:

```
Max Payment: 0.50 USDC
Rationale: Real-world testing with limited exposure
```

**Production**:

```
Max Payment: 1.00 - 5.00 USDC
Rationale: Balance flexibility with safety
```

### Wallet Strategy

**Option 1: Saved Wallet** (Recommended)

- Setup once, use everywhere
- Connect Wallet Manager on first run
- Disconnect after wallet is saved
- Future runs use saved wallet automatically

**Option 2: Private Key**

- Enter private key once in Client node
- Reused across all executions
- Good for trigger-based workflows
- Keep private key secure

**Option 3: Dynamic Wallet**

- Keep Wallet Manager connected
- Allows runtime wallet switching
- More flexible, slightly slower
- Good for multi-tenant scenarios

## Error Handling Configuration

### Enable "Continue On Fail"

For production workflows, enable on:

✅ **x402 Wallet Manager**

- Prevents workflow crash on wallet errors
- Allows error handling downstream

✅ **x402 Client**

- Prevents crash on payment errors
- Enables graceful degradation

❌ **Error Handler Nodes**

- Let these fail to alert you
- Errors in error handling should stop workflow

### Retry Configuration

Implement smart retries for transient errors:

```javascript
// In Code node before Client
const staticData = $getWorkflowStaticData("global");
const retryKey = `retry_${$json.requestId}`;
const retryCount = staticData[retryKey] || 0;

if (retryCount >= 3) {
  // Max retries - fail
  delete staticData[retryKey];
  throw new Error("Max retries exceeded");
}

staticData[retryKey] = retryCount + 1;

// Calculate exponential backoff
const waitSeconds = Math.pow(2, retryCount) * 5;

return {
  json: {
    shouldRetry: true,
    waitSeconds: waitSeconds,
    attemptNumber: retryCount + 1,
  },
};
```

## Network Configuration

### Devnet Settings

```
Network: solana-devnet
USDC Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
Funding: Free faucets
Purpose: Testing
```

**When to use**:

- Development
- Testing
- Learning
- Demos

### Mainnet Settings

```
Network: solana-mainnet
USDC Mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
Funding: Purchase USDC
Purpose: Production
```

**When to use**:

- Live workflows
- Real payments
- Production APIs
- Customer-facing automations

## Monitoring and Logging

### Balance Monitoring

```
[Schedule Trigger] Every 6 hours
    ↓
[Wallet Manager] Check Balance
    ↓
[IF] USDC < 5.00?
    ├─ YES → [Send Alert]
    │         - Email admin
    │         - Slack notification
    │         - Log warning
    └─ NO → [Log OK] Balance sufficient
```

### Payment Logging

```
[After x402 Client]
    ↓
[Code Node] Log payment
    ↓
[Database] Insert record
    OR
[HTTP Request] Send to logging service
    OR
[File] Append to CSV
```

**Log data**:

```javascript
{
  timestamp: new Date().toISOString(),
  workflow: $workflow.name,
  execution: $execution.id,
  apiUrl: "{{$node['x402 Client'].parameter.resourceUrl}}",
  amount: $json._x402Payment?.amount || "0",
  paid: $json._x402Payment !== undefined,
  success: !$json.error,
  error: $json.error || null
}
```

### Error Tracking

```
[x402 Client] Continue On Fail = ON
    ↓
[IF] Has error?
    ├─ YES → [Error Tracking]
    │         - Log to database
    │         - Send to Sentry/Datadog
    │         - Alert admin
    └─ NO → [Continue normally]
```

## Security Configuration

### Wallet Security

**Backup Strategy**:

1. Export private key after setup
2. Store in password manager (1Password, LastPass)
3. Encrypt if storing in files
4. Never commit to git
5. Never share in support tickets

**Access Control**:

- Limit who can edit workflows
- Use n8n's user permissions
- Audit workflow changes
- Review execution logs

**Key Rotation**:

```
Every 90 days (high volume):
1. Generate new wallet
2. Fund new wallet
3. Update Client nodes
4. Transfer remaining funds from old wallet
5. Archive old wallet
```

### Payment Limits

**Per-Request Limits**:
Set in x402 Client node:

```
Development: 0.10 USDC
Production: 1.00 USDC
Critical: 5.00 USDC
```

**Daily Spending Limits** (Custom):

```javascript
// In Code node before Client
const staticData = $getWorkflowStaticData("global");
const today = new Date().toISOString().split("T")[0];
const spendingKey = `spending_${today}`;

const todaySpending = staticData[spendingKey] || 0;
const dailyLimit = 10.0; // 10 USDC per day

if (todaySpending >= dailyLimit) {
  throw new Error("Daily spending limit reached");
}

// After successful payment
staticData[spendingKey] = todaySpending + parseFloat($json._x402Payment.amount);
```

### Network Isolation

**Never mix networks**:

- Devnet wallets → Devnet APIs only
- Mainnet wallets → Mainnet APIs only
- Set both Wallet Manager and Client to same network
- Errors if mismatch detected

## Performance Optimization

### Wallet Persistence

**Use Saved Wallet mode** for better performance:

```
First run (one-time overhead):
[Wallet Manager] → [Client]
~200ms (load + save wallet)

Subsequent runs (fast):
[Client only]
~50ms (load saved wallet)
```

Savings: ~150ms per execution

### Connection Optimization

**Remove Wallet Manager** after first run:

- Wallet is already saved
- No need to connect Manager
- Faster execution
- Simpler workflow

### Caching Considerations

For identical requests to same endpoint:

- x402 Client doesn't cache
- Each request may require payment
- Server may cache responses
- Check API documentation

## Multi-Environment Setup

### Development Environment

```
Workflow: "API Integration (DEV)"
Wallet Manager:
  - Network: Devnet
Client:
  - Max Payment: 0.10 USDC
  - Resource URL: http://localhost:3000/api/...
```

### Production Environment

```
Workflow: "API Integration (PROD)"
Wallet Manager:
  - Network: Mainnet
Client:
  - Max Payment: 1.00 USDC
  - Resource URL: https://api.production.com/...
```

### Environment Variables

Use n8n variables for configuration:

```javascript
// Resource URL
{{$vars.API_BASE_URL}}/endpoint

// Max payment
{{$vars.MAX_PAYMENT_USDC}}

// API key
{{$vars.API_KEY}}
```

## Webhook Integration

### Receiving Payments (Mock Server)

```
Workflow: "My Paid API"
[x402 Mock Server]
  - Path: my-api
  - Network: Devnet
  - Payment: 10000
  - Verify: false
    ↓
[Process Request]
    ↓
[Return Response]
```

Activate workflow to generate webhook URL.

### Making Payments (Client)

```
Workflow: "Call Paid API"
[Webhook Trigger]
    ↓
[x402 Client]
  - Wallet Source: Private Key
  - URL: https://n8n.com/webhook/my-api
  - Auto-Pay: true
    ↓
[Return to Caller]
```

## Load Balancing

### Multiple Client Nodes

Use same wallet across multiple parallel clients:

```
[Trigger]
    ↓
[Wallet Manager]
    ├→ [Client 1] API A
    ├→ [Client 2] API B
    └→ [Client 3] API C
         ↓
    [Merge Results]
```

All three clients use the same wallet concurrently.

### Balance Checks

Monitor balance before fan-out:

```
[Wallet Manager]
    ↓
[IF] Balance > (3 × max payment)?
    ├─ YES → [Fan Out to 3 clients]
    └─ NO → [Error: Insufficient for parallel execution]
```

## Debugging Configuration

### Enable Detailed Logging

In Client node options:

- **Show Transaction Details**: Enabled

This adds extra fields to output:

```json
{
  "_x402Payment": {
    "scheme": "exact",
    "resource": "/api/data",
    "network": "solana-devnet",
    "protocolFormat": "official"
    // ... more details
  }
}
```

### Console Logging

The nodes log detailed information to n8n console:

```bash
# View n8n logs
pm2 logs n8n

# or
journalctl -u n8n -f

# Look for:
# "🔑 Using saved wallet: ..."
# "💰 USDC Balance: ..."
# "💳 Payment required: ..."
# "✅ Payment successful!"
```

### Execution Data

Check execution panel in n8n:

- View input/output of each node
- See exact values passed
- Inspect payment payloads
- Debug workflow flow

## What's Next?

- [Replay Protection](/advanced/replay-protection/) - Prevent attacks
- [Custom Validation](/advanced/custom-validation/) - Add custom logic
- [Examples](/examples/basic-payment/) - See configurations in action
- [Error Handling](/examples/error-handling/) - Production patterns
