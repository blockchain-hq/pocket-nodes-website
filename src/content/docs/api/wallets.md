---
title: Wallet Manager Node
description: Generate and manage persistent Solana wallets for x402 payments
---

The x402 Wallet Manager node generates and manages Solana wallets for making x402 payments in your n8n workflows.

## Overview

The Wallet Manager:

- Generates Solana keypairs
- Checks USDC and SOL balances
- Provides wallet data to Client nodes
- Persists wallets across executions
- Gives funding instructions
- Supports both devnet and mainnet

## Node Configuration

### Network

Select which Solana network to use:

**Devnet** (For Testing)

- Free test tokens
- USDC faucet available
- SOL faucet available
- No real value
- Perfect for development

**Mainnet** (For Production)

- Real USDC and SOL
- Actual money at risk
- Use only after testing on devnet
- Requires purchasing USDC

### Action

Choose what the node should do:

**Get Wallet Info**

- Displays wallet address
- Shows current balances
- Includes private key in output
- Shows funding instructions if needed
- Use when setting up or connecting to Client

**Check Balance**

- Shows only current balances
- Doesn't expose private key
- Quick balance verification
- Use for monitoring

**Reset Wallet**

- Generates a new wallet
- ⚠️ WARNING: Old wallet will be lost
- Only use if you need to start fresh
- Make sure to backup old wallet first

## Output Data

### New Wallet (Needs Funding)

```json
{
  "walletAddress": "9rKnvE7PVbpq4Ws...",
  "network": "solana-devnet",
  "balances": {
    "usdc": 0,
    "sol": 0
  },
  "status": "needs_funding",
  "ready": false,
  "privateKey": "[1,2,3,...]",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "message": "New wallet generated!",
  "fundingInstructions": {
    "address": "9rKnvE7PVbpq4Ws...",
    "network": "SOLANA-DEVNET",
    "steps": [
      "Get devnet USDC from: https://spl-token-faucet.com/?token-name=USDC-Dev",
      "Get devnet SOL: https://faucet.solana.com/",
      "Wait for confirmation (~30 seconds)",
      "Re-run this node to verify balance"
    ]
  }
}
```

### Funded Wallet (Ready)

```json
{
  "walletAddress": "9rKnvE7PVbpq4Ws...",
  "network": "solana-devnet",
  "balances": {
    "usdc": 10.5,
    "sol": 1.2
  },
  "status": "ready",
  "ready": true,
  "privateKey": "[1,2,3,...]",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "message": "Wallet is funded and ready to use!"
}
```

### Balance Check (No Private Key)

When using "Check Balance" action:

```json
{
  "walletAddress": "9rKnvE7PVbpq4Ws...",
  "network": "solana-devnet",
  "balances": {
    "usdc": 8.3,
    "sol": 0.95
  },
  "status": "ready",
  "ready": true
}
```

Note: Private key is NOT included for security.

## Usage Patterns

### First-Time Setup

```
[Manual Trigger]
    ↓
[x402 Wallet Manager]
  - Network: Devnet
  - Action: Get Wallet Info
    ↓
[Execute] → Copy wallet address → Fund it → Re-run
```

### In Production Workflow

```
[Schedule Trigger]
    ↓
[x402 Wallet Manager]
  - Network: Devnet
  - Action: Get Wallet Info
    ↓
[x402 Client] (uses wallet data from Manager)
```

### Balance Monitoring

```
[Schedule Trigger] Every 6 hours
    ↓
[x402 Wallet Manager]
  - Action: Check Balance
    ↓
[IF] Balance < 1 USDC?
    ↓ YES
[Send Email] "Wallet needs funding"
```

### Multiple Networks

```
[Manual Trigger]
    ↓
[x402 Wallet Manager - Devnet]
  - Network: Devnet
    ↓
[x402 Wallet Manager - Mainnet]
  - Network: Mainnet
    ↓
[Compare Balances]
```

## Wallet Persistence

### How Wallets Are Stored

Wallets are stored in **n8n's workflow static data** at the global level:

```typescript
// Storage key
`x402Wallet_${network}`;

// Example keys
("x402Wallet_solana-devnet");
("x402Wallet_solana-mainnet");
```

### Persistence Guarantees

✅ **Persists across**:

- Workflow executions
- n8n restarts
- Workflow edits
- Node re-configuration

❌ **Does NOT persist**:

- If you delete the workflow
- If you clear workflow static data
- If you export/import to new instance

### Backup Your Wallet

For important wallets with significant funds:

1. Run Wallet Manager with "Get Wallet Info"
2. Copy the `privateKey` from output
3. Store securely (password manager, encrypted file)
4. Never commit to git or share publicly

### Multiple Wallets

The Wallet Manager maintains separate wallets for:

- Different networks (devnet vs mainnet)
- Different workflows (each workflow has its own)

To use the same wallet across workflows:

- Use "Private Key" mode in Client nodes
- Enter the same private key in each workflow

## Funding Your Wallet

### Devnet (Testing)

**Get USDC**:

1. Visit: https://spl-token-faucet.com/?token-name=USDC-Dev
2. Paste your wallet address
3. Click "Airdrop"
4. Wait ~30 seconds

**Get SOL** (for transaction fees):

1. Visit: https://faucet.solana.com/
2. Paste your wallet address
3. Click "Airdrop"
4. Wait ~30 seconds

**Verify Funding**:
Re-run Wallet Manager and check `balances` in output.

### Mainnet (Production)

**Buy USDC**:

- Coinbase, Kraken, Binance, etc.
- Withdraw to your wallet address
- Ensure you select "Solana" network

**Get SOL**:

- Buy on any exchange
- Withdraw to your wallet address
- Need at least 0.01 SOL for fees

**Double-Check**:

- Verify wallet address is correct
- Confirm network is "Solana" (not Ethereum!)
- Small test transaction first

## Security Best Practices

### 1. Never Share Private Keys

The private key gives full control of the wallet:

- Anyone with it can spend all funds
- Never commit to git
- Don't share in support tickets
- Don't paste in public channels

### 2. Use Separate Wallets

Don't use your main wallet for n8n:

- Create dedicated wallets for each workflow
- Only fund with amounts you plan to spend
- Rotate periodically for high-volume use

### 3. Limit Funding

Only fund wallets with what you need:

- Estimate monthly API costs
- Add 20% buffer
- Don't keep large amounts in hot wallets

### 4. Monitor Balances

Set up alerts:

```
[Schedule Trigger] Daily
    ↓
[Wallet Manager] Check Balance
    ↓
[IF] Balance < threshold?
    ↓
[Send Alert]
```

### 5. Test on Devnet First

Always test workflows on devnet before mainnet:

- Free tokens
- No risk
- Identical to mainnet behavior
- Find bugs without losing money

## Troubleshooting

### Wallet keeps regenerating

**Problem**: Using auto-generate mode

**Solution**:

- Switch to "Saved Wallet" mode
- Connect Wallet Manager once
- Future runs use same wallet

### Can't find wallet address

**Problem**: Don't know where to look

**Solution**:

- Run Wallet Manager node
- Check OUTPUT panel on the right
- Look for `walletAddress` field
- Copy the full address

### Balance shows 0 after funding

**Problem**: Blockchain confirmation delay

**Solution**:

- Wait 30-60 seconds after funding
- Re-run Wallet Manager
- Check on Solana Explorer:
  - Devnet: https://explorer.solana.com/?cluster=devnet
  - Mainnet: https://explorer.solana.com/

### "Network mismatch" error

**Problem**: Wallet and Client on different networks

**Solution**:

- Check Wallet Manager network setting
- Check Client node network (if visible)
- Both must be same (devnet or mainnet)

### Lost access to wallet

**Problem**: Workflow deleted or wallet reset

**Solution**:

- If you backed up private key, create new wallet with that key
- If not backed up, wallet is lost (devnet = no problem)
- Always backup wallets with significant funds

## Private Key Formats

The node accepts two formats:

### JSON Array (Default)

```json
[139,45,178,234,...]
```

This is what Wallet Manager outputs.

### Base58 String

```
5J6YvH8xK9ZwN2pQ3rT4sU5vW6xY7zA8bB9cC...
```

Both formats work identically.

## Wallet Manager + Client Integration

### Recommended Setup

**For one-time workflows**:

```
[Manual Trigger]
    ↓
[Wallet Manager] Get Wallet Info
    ↓
[x402 Client] From Wallet Manager
```

**For scheduled workflows**:

```
First run:
[Manual] → [Wallet Manager] → [x402 Client]

After first run (wallet is saved):
[Schedule] → [x402 Client] (Saved Wallet mode)
```

**For webhook workflows**:

```
[Webhook Trigger]
    ↓
[x402 Client]
  - Wallet Source: Private Key
  - Private Key: [pasted once]
```

## What's Next?

- [x402 Client](/concepts/testing-client/) - Make payment requests
- [Mock Server](/concepts/mock-server/) - Test without real payments
- [Basic Payment Example](/examples/basic-payment/) - Your first payment
- [Security](/advanced/configuration/) - Advanced security settings
