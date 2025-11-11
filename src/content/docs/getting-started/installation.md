---
title: Installation
description: Install x402 Pocket Nodes in your n8n instance
---

This guide will walk you through installing x402 Pocket Nodes in your n8n instance.

## Prerequisites

Before installing x402 Pocket Nodes, make sure you have:

- **n8n**: Self-hosted or cloud instance
- **Access**: Admin access to install community nodes

## Option 1: Install via n8n UI (Recommended)

This is the easiest way to install x402 Pocket Nodes.

### Step 1: Open Community Nodes Settings

1. Open your n8n instance
2. Click on **Settings** in the sidebar
3. Navigate to **Community Nodes**

### Step 2: Install the Package

1. Click **Install a community node**
2. Enter the package name:
   ```
   @blockchain-hq/n8n-nodes-x402-pocket
   ```
3. Click **Install**
4. Wait for the installation to complete

### Step 3: Restart n8n

Restart your n8n instance to load the new nodes:

```bash
# If using systemd
sudo systemctl restart n8n

# If using Docker
docker restart n8n

# If using pm2
pm2 restart n8n
```

### Step 4: Verify Installation

1. Create a new workflow
2. Click the **+** button to add a node
3. Search for "x402"
4. You should see three nodes:
   - x402 Wallet Manager
   - x402 Client
   - x402 Mock Server

## Option 2: Manual Installation

For self-hosted n8n instances, you can install manually.

### Install via npm

```bash
cd ~/.n8n/nodes
npm install @blockchain-hq/n8n-nodes-x402-pocket
```

### Install via pnpm

```bash
cd ~/.n8n/nodes
pnpm add @blockchain-hq/n8n-nodes-x402-pocket
```

### Restart n8n

After installation, restart your n8n instance:

```bash
# Restart your n8n process
pm2 restart n8n
# or
systemctl restart n8n
# or restart your Docker container
```

## The Three Nodes

After installation, you'll have access to these nodes:

### x402 Wallet Manager

Generate and manage Solana wallets for payments.

**Use for:**

- Initial wallet setup
- Checking balances
- Providing wallet to Client nodes

### x402 Client

Make HTTP requests to x402-enabled APIs with automatic payment.

**Use for:**

- Calling paid APIs
- Automatic payment handling
- Integration with existing workflows

### x402 Mock Server

Test x402 integration without real transactions.

**Use for:**

- Development and testing
- Learning the protocol
- Validating workflows before production

## Troubleshooting

### Nodes Not Appearing

If the nodes don't appear after installation:

1. **Check installation status**:

   - Go to Settings → Community Nodes
   - Verify the package is listed as installed

2. **Restart n8n completely**:

   ```bash
   # Stop n8n
   pm2 stop n8n
   # Start n8n
   pm2 start n8n
   ```

3. **Check n8n logs**:
   ```bash
   # View logs
   pm2 logs n8n
   # or
   journalctl -u n8n -f
   ```

### Installation Failed

If installation fails:

1. **Check n8n version**: Requires n8n v1.0.0 or higher
2. **Check permissions**: Ensure n8n has write access to `~/.n8n/nodes`
3. **Check network**: Ensure your server can access npm registry
4. **Try manual installation**: Use the manual method above

### Permission Denied

If you get permission errors:

```bash
# Fix permissions
sudo chown -R $USER:$USER ~/.n8n/nodes
```

## Verifying Installation

Create a test workflow to verify everything works:

1. **Create new workflow**
2. **Add Manual Trigger node**
3. **Add x402 Wallet Manager node**
   - Set Network to "Devnet"
   - Set Action to "Get Wallet Info"
4. **Execute the workflow**

If you see wallet information in the output, the installation was successful!

## Next Steps

Now that you have x402 Pocket Nodes installed:

- [Quick Start](/getting-started/quick-start/) - Create your first workflow
- [Wallet Setup](/concepts/wallet-setup/) - Fund your wallet
- [Basic Payment Example](/examples/basic-payment/) - Make your first payment
