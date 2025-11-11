---
title: Introduction
description: Get started with x402 Pocket Nodes - seamlessly integrate micropayments into your n8n workflows
---

x402 Pocket Nodes is a set of n8n community nodes that seamlessly integrate the x402 payment protocol into your workflows. Make HTTP requests to x402-enabled APIs with automatic Solana/USDC payment handling.

## What is x402?

The x402 protocol enables micropayments for API access, allowing services to charge per-request fees in USDC. This is particularly useful for:

- **AI Agent Workflows**: Automated workflows that access premium AI APIs
- **Premium Data Access**: Pay-per-use access to specialized data feeds
- **Micropayment Services**: Integrate pay-as-you-go services into your automations
- **Content APIs**: Access protected content with automatic payment

## Why x402 Pocket Nodes?

Integrating blockchain payments into automation workflows can be complex. x402 Pocket Nodes simplifies this by providing:

- **Automatic Payment Handling**: Detects 402 responses and handles payment automatically
- **Persistent Wallet Management**: Generate wallets once, use them everywhere
- **Solana USDC Integration**: Native support for USDC micropayments on Solana
- **Payment Limits & Safety**: Configurable spending limits prevent overspending
- **Mock Server for Testing**: Test your integrations without real transactions
- **n8n Native**: Works seamlessly with all n8n triggers and nodes

## How It Works

1. **n8n Workflow Trigger**: Your workflow starts (manual, schedule, webhook, etc.)
2. **Wallet Manager**: Provides your persistent Solana wallet to the Client node
3. **x402 Client Makes Request**: Attempts to call the x402-enabled API
4. **402 Payment Required**: API responds with payment requirements
5. **Automatic Payment**: Client creates, signs, and sends USDC payment on Solana
6. **Retry with Proof**: Client retries request with `X-PAYMENT` header
7. **Success**: API verifies payment and returns protected data

All of this happens automatically - you just configure the nodes and run your workflow!

## Quick Example Workflow

```
[Manual Trigger]
    ↓
[x402 Wallet Manager]
  - Network: Devnet
  - Action: Get Wallet Info
    ↓
[x402 Client]
  - Resource URL: https://api.example.com/premium-data
  - Auto-Pay: Enabled
  - Max Payment: 0.10 USDC
    ↓
[Process Response]
  - Use {{$json}} to access the returned data
```

## Three Powerful Nodes

### x402 Wallet Manager

Generate and manage a persistent Solana wallet for x402 payments:

- Generate wallet once and reuse across all executions
- Check USDC and SOL balances
- Get funding instructions
- Network-specific wallets (Devnet/Mainnet)

### x402 Client

Make HTTP requests to x402-enabled APIs with automatic payment:

- Automatic 402 response detection
- Payment creation and signing
- Configurable payment limits
- Transaction details in output
- Works with GET, POST, PUT, DELETE

### x402 Mock Server

Test x402 integration without real blockchain transactions:

- Webhook-based mock server
- Simulates x402 payment flow
- Perfect for development and testing
- No real money needed

## What's Next?

- [Installation](/getting-started/installation/) - Install in n8n
- [Quick Start](/getting-started/quick-start/) - Your first workflow
- [Wallet Setup](/concepts/wallet-setup/) - Setup and fund your wallet
- [Examples](/examples/basic-payment/) - Real-world workflow examples
