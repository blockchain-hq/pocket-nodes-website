---
title: Introduction
description: Get started with x402test - the testing framework for x402 payment flows on Solana
---

x402test is a complete testing framework for developing and testing HTTP 402 Payment Required flows with Solana blockchain payments. It provides both a testing client for making payment-protected requests and a mock server for simulating payment-protected endpoints.

## What is x402?

The x402 protocol enables micropayments for API access, allowing services to charge per-request fees in USDC. This is particularly useful for:

- **AI Agents**: Autonomous agents that need to make paid API calls
- **Premium APIs**: Services that charge per request
- **Micropayment Services**: Pay-per-use business models
- **Content Monetization**: Charging for access to protected content

## Why x402test?

Building and testing payment-protected APIs can be complex. x402test simplifies this process by providing:

- **Simple Testing API**: Fluent interface for making payment-protected HTTP requests
- **Mock Server**: Built-in server for simulating payment-protected endpoints
- **Solana Integration**: Native support for USDC payments on Solana's devnet and localnet
- **Auto-funded Wallets**: Test wallets are automatically created and funded
- **Replay Protection**: Built-in security against replay attacks
- **Developer Friendly**: Comprehensive examples and intuitive CLI

## How It Works

1. **Request without payment**: Client makes initial request to payment-protected endpoint
2. **402 Response**: Server responds with payment requirements (amount, recipient, asset)
3. **Payment Creation**: Client creates and signs a Solana SPL token transfer transaction
4. **Request with payment**: Client retries request with `X-PAYMENT` header containing transaction signature
5. **Server Verification**: Server verifies the transaction on Solana blockchain
6. **Response**: Server returns the protected content

## Quick Example

```typescript
import { x402 } from "x402test";

// Make a request that requires payment
const response = await x402("http://localhost:4402/api/data")
  .withPayment({ amount: "0.01" })
  .expectStatus(200)
  .execute();

console.log("Response:", response.body);
console.log("Payment signature:", response.payment?.signature);
```

## Features Overview

### Testing Client

- Fluent API for making payment-protected requests
- Automatic payment handling
- Response validation
- Payment verification
- TypeScript support

### Mock Server

- Configurable payment-protected endpoints
- Automatic payment verification
- Transaction signature tracking
- Replay attack prevention

### CLI Tools

- `x402test init` - Initialize configuration
- `x402test start` - Start mock server
- `x402test routes` - List configured routes

## What's Next?

- [Installation](/installation) - Install and set up x402test
- [Quick Start](/quick-start) - Get started in minutes
- [How x402 Works](/how-it-works) - Understand the protocol
- [API Reference](/api/client) - Detailed API documentation
