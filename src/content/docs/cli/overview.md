---
title: Showcase Server
description: Deploy your own x402-enabled API server for testing
---

The x402 Pocket Nodes package includes a **Showcase Server** - a production-ready Express.js server that demonstrates how to implement x402 payment protocol in your own APIs.

## What is the Showcase Server?

The Showcase Server is a complete example of an x402-enabled API with:

- Mixed free and paid endpoints
- Selective payment middleware
- Standards-compliant x402 implementation
- Production-ready code
- Easy deployment

## Location

The server is included in the package repository:

```
x402-pocket-nodes/
└── showcase-server/
    ├── server.js           # Main server file
    ├── test-client.js      # Automated tests
    ├── package.json        # Dependencies
    ├── Dockerfile          # Container config
    ├── docker-compose.yml  # Orchestration
    └── docs/               # Documentation
        ├── README.md
        ├── QUICKSTART.md
        ├── DEPLOYMENT.md
        └── INTEGRATION_EXAMPLES.md
```

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/blockchain-hq/x402-pocket-nodes.git
cd x402-pocket-nodes/showcase-server
```

### Install Dependencies

```bash
npm install
```

### Configure (Optional)

Set environment variables:

```bash
export WALLET_ADDRESS=your_wallet_address_here
export SOLANA_NETWORK=solana-devnet
export USDC_MINT=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
```

Or use defaults (demo wallet addresses).

### Start the Server

```bash
npm start
```

The server starts on `http://localhost:3000`.

### Test It

```bash
# In another terminal
npm test
```

This runs automated tests of all endpoints.

## API Endpoints

### Free Endpoints

No payment required:

```
GET  /health
GET  /api/info
GET  /api/public/time
GET  /api/public/quote
```

### Paid Endpoints

Require x402 payment:

```
GET  /api/premium/data      (0.01 USDC)
GET  /api/premium/analytics (0.05 USDC)
POST /api/premium/ai        (0.10 USDC)
```

## Using with n8n

### Test with HTTP Request Node (Free)

```
[Manual Trigger]
    ↓
[HTTP Request]
  - Method: GET
  - URL: http://localhost:3000/api/public/time
    ↓
[Shows time without payment]
```

### Test with x402 Client (Paid)

```
[Manual Trigger]
    ↓
[x402 Wallet Manager]
    ↓
[x402 Client]
  - URL: http://localhost:3000/api/premium/data
  - Auto-Pay: true
    ↓
[Shows data after automatic payment]
```

## Deployment

### Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Deploy to Render

1. Create account at render.com
2. New Web Service → Connect repository
3. Set environment variables
4. Deploy!

### Deploy with Docker

```bash
docker-compose up
```

## How It Works

### Selective Middleware

The showcase server applies x402 checking only where needed:

```javascript
// Free endpoint - no middleware
app.get("/api/public/time", (req, res) => {
  res.json({ timestamp: new Date() });
});

// Paid endpoint - with middleware
app.get(
  "/api/premium/data",
  requirePayment({ amount: "0.01" }), // ← x402 middleware
  (req, res) => {
    res.json({ data: "..." });
  }
);
```

### Payment Flow

1. Client requests `/api/premium/data` (no payment)
2. Server returns 402 with payment requirements
3. Client creates payment proof
4. Client retries with `X-Payment` header
5. Server verifies payment
6. Server returns protected data

### Implementation Pattern

```javascript
function requirePayment(options) {
  return async (req, res, next) => {
    const paymentHeader = req.headers["x-payment"];

    if (!paymentHeader) {
      // Return 402 Payment Required
      return res.status(402).json({
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "solana-devnet",
            maxAmountRequired: options.amount,
            payTo: SERVER_WALLET_ADDRESS,
            asset: USDC_MINT_ADDRESS,
          },
        ],
      });
    }

    // Verify payment
    const verification = verifyPayment(paymentHeader);

    if (!verification.isValid) {
      return res.status(400).json({
        error: verification.reason,
      });
    }

    // Payment valid - continue
    req.payment = verification.payment;
    next();
  };
}
```

## Testing Your Integration

Use the test client to verify behavior:

```bash
npm test
```

Output shows:

- Free endpoints (work immediately)
- Paid endpoints (return 402, then work with payment)
- Error handling
- Complete payment flow

## Customization

### Add Your Own Endpoint

```javascript
// In server.js
app.get(
  "/api/custom",
  requirePayment({
    amount: "0.25",
    description: "Custom API access",
    resource: "custom-api",
  }),
  (req, res) => {
    res.json({
      yourData: "here",
      payment: req.payment,
    });
  }
);
```

### Change Pricing

```javascript
// Modify existing endpoint
app.get('/api/premium/data',
  requirePayment({ amount: '0.05' }), // Changed from 0.01
  (req, res) => { ... }
);
```

### Add Database Tracking

```javascript
// After verification
await database.payments.insert({
  signature: req.payment.signature,
  from: req.payment.from,
  amount: req.payment.amount,
  resource: "premium-data",
  timestamp: new Date(),
});
```

## Documentation

Full documentation in the showcase-server directory:

- **README.md**: Complete overview
- **QUICKSTART.md**: Get running in 5 minutes
- **DEPLOYMENT.md**: Deploy to production platforms
- **INTEGRATION_EXAMPLES.md**: Client code examples (Python, JavaScript, Rust)
- **ARCHITECTURE.md**: System design and architecture

## Why Use the Showcase Server?

### For Learning

- See complete x402 implementation
- Understand server-side verification
- Learn middleware patterns
- Study production-ready code

### For Testing

- Test your x402 Client nodes
- Validate payment flows
- Debug integration issues
- Develop without external APIs

### For Production

- Use as starting point for your API
- Deploy as-is for demos
- Customize for your use case
- Reference implementation

## What's Next?

- [View on GitHub](https://github.com/blockchain-hq/x402-pocket-nodes/tree/main/showcase-server)
- [Deployment Guide](https://github.com/blockchain-hq/x402-pocket-nodes/blob/main/showcase-server/DEPLOYMENT.md)
- [Integration Examples](https://github.com/blockchain-hq/x402-pocket-nodes/blob/main/showcase-server/INTEGRATION_EXAMPLES.md)
- [Test with n8n](/examples/basic-payment/)
