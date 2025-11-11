---
title: start Command
description: Start the x402test mock server
---


The `start` command launches the x402test mock server for testing payment flows.

## Usage

```bash
npx x402test start [options]
```

## What It Does

1. **Loads Configuration**: Reads `x402test.config.js`
2. **Initializes Wallets**: Loads or creates test wallets
3. **Starts Server**: Launches HTTP server with configured routes
4. **Accepts Payments**: Processes and verifies payment requests

## Options

### --config, -c

Specify a custom configuration file.

```bash
npx x402test start --config ./custom.config.js
```

**Default:** `./x402test.config.js`

### --port, -p

Override the port from configuration.

```bash
npx x402test start --port 8080
```

**Default:** Value from config file (default: 4402)

## Output

```
--------------------------------------------------
x402test v0.1.2
Testing Solana x402 Payment Flows
--------------------------------------------------

✔ Loaded config from ./x402test.config.js
✔ Server started successfully

 x402test Mock Server Started
   Port: 4402
   Network: solana-devnet
   Recipient: FcxKSp7YxqYXdq...

 Configured Routes:
   /api/premium
     Price: 0.10 USDC
     Description: Premium content access
   /api/data
     Price: 0.01 USDC
     Description: Data API access

 Ready to accept payments at http://localhost:4402
```

## Default Behavior

If no config file is found:

```bash
npx x402test start
```

```
✘ No config file found, using default configuration
✘ Run "x402test init" to create a config file

✔ Server started successfully

 x402test Mock Server Started
   Port: 4402
   Network: solana-devnet
   Recipient: (temp wallet)

 Configured Routes:
   /api/test
     Price: 0.01 USDC
     Description: Test endpoint

 Ready to accept payments at http://localhost:4402
```

## Examples

### Basic Start

```bash
npx x402test start
```

### Custom Port

```bash
npx x402test start --port 8080
```

### Custom Config

```bash
npx x402test start --config ./production.config.js
```

### Using Environment Variables

```bash
PORT=8080 npx x402test start
```

## Server Logs

The server logs all requests and payments:

### Successful Payment

```
 GET /api/data
   X-PAYMENT header present
   Found token transfer (type 12)
   Source owner: FcxKSp7YxqYXdq...
   Destination owner: EPjFWdd5Aufq...
   Marked signature used: 5XzT4qW3... for /api/data with amount 10000
✔ Payment verified
✔ Response sent: 200
```

### Payment Required

```
 GET /api/premium
✔ Payment required response sent: 402
```

### Failed Verification

```
 GET /api/data
   X-PAYMENT header present
✘ Payment verification failed: Insufficient amount
✔ Payment required response sent: 402
```

## Stopping the Server

Press `Ctrl+C` to stop the server:

```
^C
Server stopped
```

## Background Mode

### Using nohup

```bash
nohup npx x402test start > server.log 2>&1 &
```

### Using pm2

```bash
npm install -g pm2

pm2 start "npx x402test start" --name x402test

pm2 logs x402test

pm2 stop x402test
```

### Using screen

```bash
screen -S x402test

npx x402test start


screen -r x402test
```

## Server Configuration

The server uses settings from `x402test.config.js`:

```javascript
export default {
  // Server port
  port: 4402,

  // Solana network
  network: "solana-devnet",

  // Solana RPC URL
  rpcUrl: "http://localhost:8899",

  // Wallet to receive payments
  recipient: "FcxKSp7YxqYXdq...",

  // Payment-protected endpoints
  routes: {
    "/api/endpoint": {
      price: "0.01",
      description: "Endpoint description",
      response: { data: "response" },
    },
  },
};
```

## Error Handling

### Port Already in Use

```
✘ Failed to start server: Port 4402 is already in use
```

**Solutions:**

```bash
npx x402test start --port 8080

lsof -ti:4402 | xargs kill
```

### Config File Not Found

```
✘ Failed to load config: Config file not found
```

**Solution:**

```bash
npx x402test init
npx x402test start
```

### Invalid Configuration

```
✘ Failed to load config: Invalid configuration format
```

**Solution:**

1. Check config file syntax
2. Ensure it exports a default object
3. Validate all required fields

### Wallet Not Found

```
✘ Failed to start server: Wallet not found
```

**Solution:**

```bash
npx x402test init --force
npx x402test start
```

### RPC Connection Failed

```
✘ Failed to connect to Solana RPC
```

**Solutions:**

1. Start Solana validator: `solana-test-validator`
2. Check RPC URL in config
3. Verify network connectivity

## Health Check

Check if server is running:

```bash
curl http://localhost:4402/api/test
```

Should return 402 Payment Required:

```json
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "solanaTransferChecked",
    "maxAmountRequired": "10000",
    ...
  }]
}
```

## Production Deployment

### Using Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4402
CMD ["npx", "x402test", "start"]
```

### Using systemd

```ini
[Unit]
Description=x402test Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/npx x402test start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Best Practices

1. **Local Validator**: Use `solana-test-validator` for development
2. **Port Management**: Use standard port (4402) or environment variable
3. **Log Rotation**: Implement log rotation for production
4. **Monitoring**: Monitor server health and payment processing
5. **Security**: Never expose test wallets in production

## Next Steps

- [routes Command](/cli/routes) - List configured routes
- [Testing Client](/testing-client) - Make payment requests
- [Mock Server](/mock-server) - Configure routes
