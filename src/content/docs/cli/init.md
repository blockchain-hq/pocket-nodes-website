---
title: init Command
description: Initialize x402test configuration
---


The `init` command creates a configuration file and test wallet for your project.

## Usage

```bash
npx x402test init [options]
```

## What It Does

1. **Creates Configuration File**: Generates `x402test.config.js`
2. **Creates Test Wallet**: Generates and funds a test wallet
3. **Saves Wallet**: Stores wallet in `.x402test-wallets.json`

## Options

### --force, -f

Overwrite existing configuration file.

```bash
npx x402test init --force
```

**Use Case:** Recreate configuration after accidental modification

## Output

```
✔ Initializing x402test configuration...
✔ Creating new x402test config...
✔ Creating test wallet...
✔ Config file created at x402test.config.js
✔ Recipient wallet: FcxKSp7YxqYXdq...
✔ USDC balance: 1000 USDC
✔ Ready to start your server! Run 'x402test start' to start the server.
```

## Generated Files

### x402test.config.js

```javascript
// x402test configuration
export default {
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",

  recipient: "FcxKSp7YxqYXdq...",

  routes: {
    "/api/premium": {
      price: "0.10",
      description: "Premium content access",
      response: {
        data: "This is premium content!",
        timestamp: Date.now(),
      },
    },

    "/api/data": {
      price: "0.01",
      description: "Data API access",
      response: (req) => ({
        method: req.method,
        path: req.path,
        data: { message: "Your data here" },
      }),
    },
  },
};
```

### .x402test-wallets.json

```json
{
  "wallets": [{
    "publicKey": "FcxKSp7YxqYXdq...",
    "secretKey": [...],
    "tokenAccounts": {
      "USDC": "EPjFWdd5AufqSSqeM2..."
    }
  }],
  "mints": {
    "USDC": "EPjFWdd5AufqSSqeM2..."
  }
}
```

**Important:** Add to `.gitignore`!

```
.x402test-wallets.json
```

## Examples

### Basic Initialization

```bash
npx x402test init
```

### Force Overwrite

```bash
npx x402test init --force
```

Use when you want to:

- Reset configuration to defaults
- Fix corrupted config file
- Start fresh after experiments

## Customizing Generated Config

After running `init`, edit `x402test.config.js`:

### Change Port

```javascript
export default {
  port: 8080, // Change from 4402
  // ... rest of config
};
```

### Add Routes

```javascript
export default {
  // ... existing config
  routes: {
    "/api/premium": {
      price: "0.10",
      description: "Premium content",
      response: { data: "Premium content" },
    },
    "/api/basic": {
      price: "0.01",
      description: "Basic content",
      response: { data: "Basic content" },
    },
    // Add your routes here
    "/api/custom": {
      price: "0.05",
      description: "Custom endpoint",
      response: { custom: true },
    },
  },
};
```

### Use Environment Variables

```javascript
export default {
  port: parseInt(process.env.PORT || "4402"),
  rpcUrl: process.env.RPC_URL || "http://localhost:8899",
  recipient: process.env.RECIPIENT_WALLET || "default-wallet",
  // ... rest of config
};
```

## Error Handling

### Config Already Exists

```
✘ Config file already exists. Use --force to overwrite.
```

**Solution:**

```bash
npx x402test init --force
```

### Wallet Creation Failed

```
✘ Failed to create wallet: Connection failed
```

**Solutions:**

1. Check Solana validator is running
2. Verify RPC URL is correct
3. Check network connectivity

### Permission Denied

```
✘ EACCES: permission denied
```

**Solutions:**

1. Check file permissions
2. Run in different directory
3. Use `sudo` (not recommended)

## Best Practices

1. **Version Control**: Commit `x402test.config.js`, not `.x402test-wallets.json`
2. **Security**: Never share or commit wallet files
3. **Team Setup**: Each developer runs `init` independently
4. **CI/CD**: Run `init` in CI pipeline for testing

## .gitignore Setup

Add these to `.gitignore`:

```
.x402test-wallets.json
.x402test-signatures.json

```

## Next Steps

After running `init`:

1. **Review Config**: Check `x402test.config.js` settings
2. **Start Server**: Run `npx x402test start`
3. **Make Request**: Test with x402 client
4. **Customize**: Add your own routes and responses

## Related Commands

- [start Command](/cli/start) - Start the server
- [routes Command](/cli/routes) - View configured routes

## Troubleshooting

### Fresh Start

If something goes wrong:

```bash
rm x402test.config.js
rm .x402test-wallets.json
rm .x402test-signatures.json

npx x402test init
```

### Wallet Balance Issues

```bash
rm .x402test-wallets.json
npx x402test init
```

The new wallet will have 1000 USDC again.
