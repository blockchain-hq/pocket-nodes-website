---
title: Mock Server
description: Configure and run the x402test mock server
---


The x402test mock server simulates payment-protected endpoints for testing your client applications and AI agents.

## Quick Start

```bash
npx x402test init

npx x402test start
```

## Configuration File

The configuration file (`x402test.config.js`) defines your server settings and routes:

```javascript
export default {
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",
  recipient: "YOUR_WALLET_ADDRESS",

  routes: {
    "/api/data": {
      price: "0.01",
      description: "Data API access",
      response: { message: "Your data here" },
    },
  },
};
```

## Server Options

### Port

```javascript
{
  port: 4402; // Server port (default: 4402)
}
```

### Network

```javascript
{
  network: "solana-devnet"; // or 'solana-localnet', 'solana-mainnet'
}
```

### RPC URL

```javascript
{
  rpcUrl: "http://localhost:8899"; // Solana RPC endpoint
}
```

### Recipient

```javascript
{
  recipient: "FcxKSp7YxqYXdq..."; // Wallet to receive payments
}
```

## Route Configuration

### Static Response

```javascript
routes: {
  '/api/static': {
    price: '0.01',
    description: 'Static content',
    response: {
      data: 'Hello World',
      timestamp: Date.now()
    }
  }
}
```

### Dynamic Response

```javascript
routes: {
  '/api/dynamic': {
    price: '0.01',
    description: 'Dynamic content',
    response: (req) => ({
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: Date.now()
    })
  }
}
```

### Custom Status Code

```javascript
routes: {
  '/api/created': {
    price: '0.01',
    description: 'Returns 201',
    status: 201,
    response: { created: true }
  }
}
```

### Different Price Tiers

```javascript
routes: {
  '/api/basic': {
    price: '0.01',    // 1 cent
    description: 'Basic tier',
    response: { tier: 'basic' }
  },
  '/api/premium': {
    price: '0.10',    // 10 cents
    description: 'Premium tier',
    response: { tier: 'premium' }
  },
  '/api/enterprise': {
    price: '1.00',    // 1 dollar
    description: 'Enterprise tier',
    response: { tier: 'enterprise' }
  }
}
```

## HTTP Methods

The mock server supports all HTTP methods:

```javascript
// Configuration
routes: {
  '/api/resource': {
    price: '0.01',
    description: 'CRUD endpoint',
    response: (req) => {
      switch (req.method) {
        case 'GET':
          return { action: 'read', data: [] };
        case 'POST':
          return { action: 'create', body: req.body };
        case 'PUT':
          return { action: 'update', body: req.body };
        case 'DELETE':
          return { action: 'delete' };
        default:
          return { action: 'unknown' };
      }
    }
  }
}
```

```typescript
// Client usage
await x402(url).get().withPayment("0.01").execute();
await x402(url).post({...}).withPayment("0.01").execute();
await x402(url).put({...}).withPayment("0.01").execute();
await x402(url).delete().withPayment("0.01").execute();
```

## CLI Commands

### Start Server

```bash
npx x402test start

npx x402test start --config ./my-config.js

npx x402test start --port 8080
```

### List Routes

```bash
npx x402test routes

npx x402test routes --config ./my-config.js
```

Output:

```
Configured Routes:

/api/data: Data API access
  Price: 0.01 USDC
  Response: { "message": "Your data here" }
  Status: 200

/api/premium: Premium content access
  Price: 0.10 USDC
  Response: { "data": "Premium content" }
  Status: 200
```

## Server Logs

The server logs all requests and payment verifications:

```
 GET /api/data
   X-PAYMENT header present
   Found token transfer (type 12)
   Account indices: [0, 1, 2, 3, 4]
   Source token account: FcxKSp...
   Dest token account: EPjFWdd...
   Mint: EPjFWdd5AufqSSqeM2qN...
   Source owner: FcxKSp7YxqYXdq...
   Destination owner: EPjFWdd5Aufq...
✓ Payment verified
✓ Response sent: 200
```

## Payment Verification

The server automatically:

1. **Parses X-PAYMENT Header**: Extracts payment information
2. **Fetches Transaction**: Retrieves transaction from Solana
3. **Verifies Amount**: Checks payment meets requirement
4. **Verifies Recipient**: Ensures correct recipient
5. **Verifies Token**: Confirms USDC was used
6. **Checks Replay**: Prevents signature reuse
7. **Marks Used**: Stores signature in `.x402test-signatures.json`

## Error Responses

### No Payment

```typescript
// Request without X-PAYMENT header
// Response: 402
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "solanaTransferChecked",
    "maxAmountRequired": "10000",
    // ... other fields
  }],
  "error": null
}
```

### Insufficient Payment

```typescript
// Paid 0.005, required 0.01
// Response: 402
{
  "x402Version": 1,
  "accepts": [...],
  "error": "Insufficient amount: expected 10000, got 5000"
}
```

### Invalid Payment

```typescript
// Invalid or expired transaction
// Response: 402
{
  "x402Version": 1,
  "accepts": [...],
  "error": "Transaction not found or not confirmed"
}
```

### Replay Attack

```typescript
// Signature already used
// Response: 402
{
  "x402Version": 1,
  "accepts": [...],
  "error": "Payment already processed"
}
```

## Advanced Configuration

### Multiple Recipients

```javascript
// You can configure different routes with different recipients
routes: {
  '/api/service-a': {
    price: '0.01',
    response: { service: 'A' }
    // Uses default recipient
  },
  '/api/service-b': {
    price: '0.02',
    response: (req) => {
      // Could manually verify with different recipient
      return { service: 'B' };
    }
  }
}
```

### Request Validation

```javascript
routes: {
  '/api/validated': {
    price: '0.01',
    description: 'Validated endpoint',
    response: (req) => {
      // Access request details
      if (!req.query.userId) {
        return { error: 'userId required' };
      }

      return {
        userId: req.query.userId,
        data: 'Your content'
      };
    }
  }
}
```

### Complex Responses

```javascript
routes: {
  '/api/complex': {
    price: '0.05',
    description: 'Complex response',
    response: (req) => {
      const now = Date.now();
      return {
        data: {
          id: Math.random().toString(36),
          timestamp: now,
          expires: now + 3600000,
          content: 'Your premium content',
          metadata: {
            version: '1.0',
            format: 'json'
          }
        },
        _links: {
          self: `${req.protocol}://${req.get('host')}${req.path}`,
          related: '/api/related'
        }
      };
    }
  }
}
```

## Environment Variables

You can use environment variables in your configuration:

```javascript
export default {
  port: parseInt(process.env.PORT || "4402"),
  rpcUrl: process.env.RPC_URL || "http://localhost:8899",
  recipient: process.env.RECIPIENT_WALLET || "default-wallet",

  routes: {
    // ... routes
  },
};
```

## Next Steps

- [Testing Client](/testing-client) - Use the client to test your server
- [CLI Reference](/cli/overview) - Learn all CLI commands
- [Examples](/examples/basic-payment) - See complete examples
