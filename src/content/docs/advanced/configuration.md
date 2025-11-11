---
title: Configuration
description: Advanced configuration options for x402test
---


Deep dive into x402test configuration options.

## Configuration File Structure

```javascript
// x402test.config.js
export default {
  // Server settings
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",
  recipient: "YOUR_WALLET_ADDRESS",

  // Route definitions
  routes: {
    "/path": {
      price: "0.01",
      description: "Description",
      status: 200,
      response: {},
    },
  },
};
```

## Server Configuration

### Port

```javascript
{
  port: 4402; // Default port
}
```

Override with CLI:

```bash
npx x402test start --port 8080
```

Or environment variable:

```javascript
{
  port: parseInt(process.env.PORT || "4402");
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
  rpcUrl: "http://localhost:8899"; // Local validator
  // rpcUrl: 'https://api.devnet.solana.com'  // Public devnet
  // rpcUrl: 'https://api.mainnet-beta.solana.com'  // Mainnet
}
```

### Recipient Wallet

```javascript
{
  recipient: "FcxKSp7YxqYXdq..."; // Wallet to receive payments
}
```

## Route Configuration

### Basic Route

```javascript
routes: {
  '/api/endpoint': {
    price: '0.01',
    description: 'Endpoint description',
    response: { data: 'static response' }
  }
}
```

### Dynamic Response

```javascript
routes: {
  '/api/dynamic': {
    price: '0.01',
    description: 'Dynamic endpoint',
    response: (req) => ({
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
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
    status: 201,  // Custom status
    response: { created: true }
  }
}
```

### Request Validation

```javascript
routes: {
  '/api/validated': {
    price: '0.05',
    response: (req) => {
      // Validate request
      if (!req.query.userId) {
        return {
          error: 'userId parameter required',
          status: 400
        };
      }

      return {
        userId: req.query.userId,
        data: 'Your data'
      };
    }
  }
}
```

## Environment-Based Configuration

### Development vs Production

```javascript
const isDev = process.env.NODE_ENV !== "production";

export default {
  port: isDev ? 4402 : 8080,
  network: isDev ? "solana-localnet" : "solana-devnet",
  rpcUrl: isDev ? "http://localhost:8899" : "https://api.devnet.solana.com",

  recipient: process.env.RECIPIENT_WALLET,

  routes: isDev ? devRoutes : prodRoutes,
};
```

### Multiple Environments

```javascript
// config/dev.js
export const devConfig = {
  port: 4402,
  network: "solana-localnet",
  rpcUrl: "http://localhost:8899",
  routes: {
    /* dev routes */
  },
};

// config/prod.js
export const prodConfig = {
  port: 8080,
  network: "solana-devnet",
  rpcUrl: "https://api.devnet.solana.com",
  routes: {
    /* prod routes */
  },
};

// x402test.config.js
import { devConfig } from "./config/dev.js";
import { prodConfig } from "./config/prod.js";

const env = process.env.NODE_ENV || "development";

export default env === "production" ? prodConfig : devConfig;
```

## Dynamic Route Loading

### Loading from Directory

```javascript
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

function loadRoutes(dir) {
  const routes = {};
  const files = readdirSync(dir);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = readFileSync(join(dir, file), "utf8");
      const route = JSON.parse(content);
      routes[route.path] = route.config;
    }
  }

  return routes;
}

export default {
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",
  recipient: process.env.RECIPIENT_WALLET,
  routes: loadRoutes("./routes"),
};
```

### Route Factory

```javascript
function createRoute(path, price, handler) {
  return {
    [path]: {
      price,
      description: `Auto-generated route for ${path}`,
      response: handler,
    },
  };
}

const routes = {
  ...createRoute("/api/users", "0.01", getUsersHandler),
  ...createRoute("/api/products", "0.02", getProductsHandler),
  ...createRoute("/api/orders", "0.05", getOrdersHandler),
};

export default {
  // ... other config
  routes,
};
```

## TypeScript Configuration

```typescript
// x402test.config.ts
import type { ServerConfig, RouteConfig } from "x402test/server/config";
import type { Request } from "express";

const routes: Record<string, RouteConfig> = {
  "/api/typed": {
    price: "0.01",
    description: "Typed endpoint",
    response: (req: Request) => ({
      method: req.method,
      path: req.path,
    }),
  },
};

const config: ServerConfig = {
  port: 4402,
  network: "solana-devnet",
  rpcUrl: "http://localhost:8899",
  recipient: process.env.RECIPIENT_WALLET || "",
  routes,
};

export default config;
```

## Best Practices

1. **Use Environment Variables**: Never hardcode sensitive data
2. **Separate Concerns**: Keep routes in separate files
3. **Type Safety**: Use TypeScript for configuration
4. **Validation**: Validate configuration on startup
5. **Documentation**: Document custom routes

## Next Steps

- [Replay Protection](/advanced/replay-protection) - Security features
- [Custom Validation](/advanced/custom-validation) - Advanced validation
