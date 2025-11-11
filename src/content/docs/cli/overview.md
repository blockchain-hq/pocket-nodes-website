---
title: CLI Overview
description: Overview of the x402test command-line interface
---


x402test provides a command-line interface for managing your test environment.

## Installation

The CLI is included when you install x402test:

```bash
pnpm add -D x402test
```

## Available Commands

| Command  | Description                                     |
| -------- | ----------------------------------------------- |
| `init`   | Initialize configuration and create test wallet |
| `start`  | Start the mock server                           |
| `routes` | List configured routes                          |

## Basic Usage

```bash
npx x402test init

npx x402test start

npx x402test routes
```

## Command Structure

```bash
x402test <command> [options]
```

## Global Options

### Version

```bash
x402test --version
x402test -v
```

### Help

```bash
x402test --help

x402test init --help
x402test start --help
x402test routes --help
```

## npx vs Local

### Using npx (Recommended)

```bash
npx x402test start
```

**Advantages:**

- Always uses latest version
- No global installation needed
- Works in any project

### Local Installation

```bash
npm install -g x402test

x402test start
```

## Configuration File

Most commands look for `x402test.config.js` by default:

```javascript
// x402test.config.js
export default {
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",
  recipient: "YOUR_WALLET_ADDRESS",
  routes: {
    // ... routes
  },
};
```

You can specify a custom config file with `--config`:

```bash
npx x402test start --config ./custom.config.js
```

## Quick Reference

### Initialize Project

```bash
npx x402test init
```

Creates:

- `x402test.config.js` - Configuration
- `.x402test-wallets.json` - Test wallets

### Start Development Server

```bash
npx x402test start
```

Starts mock server at `http://localhost:4402`

### Custom Port

```bash
npx x402test start --port 8080
```

### List Routes

```bash
npx x402test routes
```

Shows all configured payment-protected endpoints

## Environment Variables

You can use environment variables in your config:

```javascript
// x402test.config.js
export default {
  port: parseInt(process.env.PORT || "4402"),
  rpcUrl: process.env.RPC_URL || "http://localhost:8899",
  recipient: process.env.RECIPIENT_WALLET,
  routes: {
    // ... routes
  },
};
```

Usage:

```bash
PORT=8080 npx x402test start
```

## Exit Codes

| Code | Meaning        |
| ---- | -------------- |
| 0    | Success        |
| 1    | Error occurred |

## Troubleshooting

### Command Not Found

```bash
pnpm add -D x402test

npx x402test --version
```

### Permission Denied

```bash
sudo x402test start

npx x402test start
```

### Config File Not Found

```bash
npx x402test init

npx x402test start --config ./my-config.js
```

### Port Already in Use

```bash
npx x402test start --port 8080

lsof -ti:4402 | xargs kill
```

## Next Steps

- [init Command](/cli/init) - Initialize configuration
- [start Command](/cli/start) - Start mock server
- [routes Command](/cli/routes) - List routes
