---
title: routes Command
description: List configured payment-protected routes
---


The `routes` command displays all configured payment-protected endpoints.

## Usage

```bash
npx x402test routes [options]
```

## What It Does

1. **Loads Configuration**: Reads `x402test.config.js`
2. **Parses Routes**: Extracts route information
3. **Displays Summary**: Shows endpoints, prices, and descriptions

## Options

### --config, -c

Specify a custom configuration file.

```bash
npx x402test routes --config ./custom.config.js
```

**Default:** `./x402test.config.js`

## Output

```
Configured Routes:

/api/premium: Premium content access
  Price: 0.10 USDC
  Response: {
    "data": "This is premium content!",
    "timestamp": 1699564800000
  }
  Status: 200

/api/data: Data API access
  Price: 0.01 USDC
  Response: [Function: response]
  Status: 200
```

## Examples

### Basic Usage

```bash
npx x402test routes
```

### Custom Config

```bash
npx x402test routes --config ./production.config.js
```

### Save to File

```bash
npx x402test routes > routes.txt
```

### Filter with grep

```bash
npx x402test routes | grep "Price:"
```

## Understanding Output

### Route Path

```
/api/premium: Premium content access
```

- `/api/premium`: Endpoint URL path
- `Premium content access`: Description from config

### Price

```
  Price: 0.10 USDC
```

Amount in USDC required to access this endpoint.

### Response

```
  Response: {
    "data": "This is premium content!",
    "timestamp": 1699564800000
  }
```

Shows the response structure:

- Static responses: Full JSON displayed
- Dynamic responses: Shows `[Function: response]`

### Status

```
  Status: 200
```

HTTP status code returned on successful payment.

## Configuration Reference

Routes are defined in `x402test.config.js`:

```javascript
export default {
  routes: {
    "/api/premium": {
      price: "0.10",
      description: "Premium content access",
      status: 200,
      response: {
        data: "This is premium content!",
      },
    },
    "/api/data": {
      price: "0.01",
      description: "Data API access",
      status: 200,
      response: (req) => ({
        method: req.method,
        path: req.path,
        data: { message: "Your data here" },
      }),
    },
  },
};
```

## Error Handling

### Config Not Found

```
✘ Failed to load config: Config file not found: ./x402test.config.js
```

**Solution:**

```bash
npx x402test init
npx x402test routes
```

### Invalid Config

```
✘ Failed to load config: Invalid configuration format
```

**Solutions:**

1. Check config file syntax
2. Ensure proper ES6 module export
3. Validate route structure

### No Routes Configured

```
Configured Routes:

(empty)
```

**Solution:** Add routes to config file.

## Use Cases

### Documentation

Generate route documentation:

```bash
npx x402test routes > API.md
```

### Validation

Verify routes before deployment:

```bash
npx x402test routes
```

Check output for:

- Correct prices
- Proper descriptions
- Valid response structures

### Team Communication

Share route configuration with team:

```bash
npx x402test routes | pbcopy  # macOS
npx x402test routes | xclip   # Linux
```

### Integration Testing

Use route info in tests:

```bash
#!/bin/bash
routes=$(npx x402test routes)
echo "$routes"

```

## Comparing Configurations

Compare different configs:

```bash
npx x402test routes --config dev.config.js > dev-routes.txt

npx x402test routes --config prod.config.js > prod-routes.txt

diff dev-routes.txt prod-routes.txt
```

## Scripting

### Extract All Prices

```bash
npx x402test routes | grep "Price:" | awk '{print $2, $3}'
```

### Count Routes

```bash
npx x402test routes | grep -c "Price:"
```

### List Only Endpoints

```bash
npx x402test routes | grep "^/" | awk -F: '{print $1}'
```

## JSON Output (Future)

Currently outputs human-readable format. For JSON output:

```javascript
// In your script
import { loadConfig } from "x402test/server/config.js";

const config = await loadConfig("./x402test.config.js");
console.log(JSON.stringify(config.routes, null, 2));
```

## Best Practices

1. **Regular Checks**: Run before deployment
2. **Documentation**: Keep route list updated
3. **Validation**: Verify prices and descriptions
4. **Automation**: Include in CI/CD pipeline
5. **Version Control**: Track route changes in git

## Integration with Testing

Use route info in tests:

```typescript
import { loadConfig } from "x402test/server/config.js";
import { x402 } from "x402test";

describe("All Routes", () => {
  let config;

  beforeAll(async () => {
    config = await loadConfig("./x402test.config.js");
  });

  Object.entries(config.routes).forEach(([path, route]) => {
    it(`should access ${path}`, async () => {
      const response = await x402(`http://localhost:4402${path}`)
        .withPayment(route.price)
        .expectStatus(route.status || 200)
        .execute();

      expect(response.payment).toBeDefined();
    });
  });
});
```

## Next Steps

- [init Command](/cli/init) - Initialize configuration
- [start Command](/cli/start) - Start mock server
- [Mock Server](/mock-server) - Configure routes
