---
title: Client Node Reference
description: Complete reference for the x402 Client node
---

Complete configuration reference for the x402 Client node in n8n.

## Node Properties

### Wallet Source

| Value        | Description                | Use Case                               |
| ------------ | -------------------------- | -------------------------------------- |
| `saved`      | Saved Wallet (Recommended) | Workflows with persistent wallet needs |
| `privateKey` | Private Key (Reusable)     | Trigger-based workflows                |
| `external`   | From Wallet Manager Node   | Dynamic wallet management              |
| `auto`       | Auto-Generate Per Node     | Quick testing only                     |

**Default**: `saved`

### Network (for Auto-Generate mode)

| Value            | Description                 |
| ---------------- | --------------------------- |
| `solana-devnet`  | Solana Devnet (testing)     |
| `solana-mainnet` | Solana Mainnet (production) |

**Default**: `solana-devnet`

### Resource URL

**Type**: String (required)

The full URL of the x402-enabled API endpoint.

**Examples**:

```
https://api.example.com/premium-data
http://localhost:3000/webhook/test-api
https://your-n8n.com/webhook/9bb44e4d-9e52-442b-a4fb-53ea7029ef1c/n
```

### HTTP Method

| Value    | Description     |
| -------- | --------------- |
| `GET`    | Retrieve data   |
| `POST`   | Send data       |
| `PUT`    | Update resource |
| `DELETE` | Remove resource |

**Default**: `POST`

### Request Body

**Type**: JSON string

**Default**: `{}`

**Only shown for**: POST and PUT requests

The request body to send to the API.

**Static example**:

```json
{
  "query": "search term",
  "limit": 10
}
```

**Dynamic example**:

```json
{
  "userId": "{{$json.userId}}",
  "timestamp": "{{new Date().toISOString()}}",
  "data": "{{$json.inputData}}"
}
```

### Headers

**Type**: Collection

Custom HTTP headers to include in the request.

**Structure**:

```
Name: Header name (e.g., "X-API-Key")
Value: Header value (e.g., "abc123" or "{{$json.apiKey}}")
```

**Common headers**:

- `Authorization`: `Bearer {{$json.token}}`
- `X-API-Key`: `{{$json.apiKey}}`
- `Content-Type`: `application/json`
- `User-Agent`: `n8n-x402-client/1.0`

### Auto-Pay

**Type**: Boolean

**Default**: `true`

When enabled:

- Automatically handles 402 responses
- Creates and signs payments
- Retries with payment proof
- Returns protected data

When disabled:

- Throws error on 402 response
- Useful for manual payment handling

### Max Payment Amount (USDC)

**Type**: Number

**Default**: `1`

**Only shown when**: Auto-Pay is enabled

Maximum USDC amount willing to pay per request. Acts as a safety limit.

**Recommended values**:

- Development: `0.10`
- Production: `1.00`
- High-value APIs: `5.00`
- Mission-critical: `10.00`

### Protocol Format

**Type**: Options

**Default**: `official`

**Only shown when**: Auto-Pay is enabled

| Value      | Description             | Use Case               |
| ---------- | ----------------------- | ---------------------- |
| `official` | Official X-402 Protocol | Standard x402 servers  |
| `legacy`   | Signed Transaction      | Custom implementations |

**Official X-402 Protocol**:

- Signature-based payment proof
- No blockchain transaction sent
- Fast and efficient
- Standard compliant

**Signed Transaction (Legacy)**:

- Pre-signed Solana transaction
- Can be settled on-chain
- Compatible with custom servers
- Requires more processing

### Options

**Show Transaction Details**

**Type**: Boolean

**Default**: `false`

When enabled, includes additional payment metadata in output:

```json
{
  "_x402Payment": {
    "scheme": "exact",
    "resource": "/api/data",
    "network": "solana-devnet"
  }
}
```

**Clear Saved Wallet**

**Type**: Boolean

**Default**: `false`

**Only for**: "Saved Wallet" mode

Clears the saved wallet. Next run will require Wallet Manager connection to set up new wallet.

**Reset Wallet**

**Type**: Boolean

**Default**: `false`

**Only for**: "Auto-Generate" mode

Generates a new wallet for this node instance.

## Input Data

### From Wallet Manager (External Mode)

Expected input when using "From Wallet Manager Node" mode:

```json
{
  "walletAddress": "9rKnvE7...",
  "privateKey": "[1,2,3,...]",
  "network": "solana-devnet",
  "balances": {
    "usdc": 10.5,
    "sol": 1.2
  },
  "ready": true
}
```

### From Saved Wallet (First Time)

On first connection from Wallet Manager, wallet data is saved:

```json
{
  "privateKey": "[1,2,3,...]",
  "walletAddress": "9rKnvE7...",
  "network": "solana-devnet"
}
```

After this, no input needed - wallet is persistent.

## Output Data

### Successful Payment

```json
{
  // API response data
  "result": "your data",
  "status": "success",

  // Payment metadata
  "_x402Payment": {
    "amount": "0.01",
    "currency": "USDC",
    "recipient": "ABC123...",
    "sender": "9rKnvE7...",
    "network": "solana-devnet",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Free Endpoint

If endpoint doesn't require payment:

```json
{
  "result": "your data",
  "status": "success"
}
```

No `_x402Payment` field.

### Error

When "Continue On Fail" is enabled:

```json
{
  "error": "Insufficient balance!",
  "walletAddress": "9rKnvE7...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Using in Expressions

Access data in subsequent nodes:

### Check if payment was made

```javascript
{
  {
    $json._x402Payment !== undefined;
  }
}
```

### Get payment amount

```javascript
{
  {
    $json._x402Payment.amount;
  }
}
```

### Get API response

```javascript
{
  {
    $json.result;
  }
}
{
  {
    $json.data;
  }
}
{
  {
    $json;
  }
} // Full response
```

### Conditional logic

```javascript
{
  {
    $json._x402Payment ? "Paid request" : "Free request";
  }
}
```

## Error Messages

### Insufficient Balance

```
Insufficient balance!

Wallet: 9rKnvE7PVbpq4...
USDC: 0.005
SOL: 0.5

• Get USDC: https://spl-token-faucet.com/?token-name=USDC-Dev
• Get SOL: https://faucet.solana.com/

After funding, re-run this workflow.
```

### Payment Exceeds Limit

```
Payment required (0.50 USDC) exceeds max payment limit (0.10 USDC)
```

### No Wallet Data Found

```
No wallet data found. Please connect the "x402 Wallet Manager"
node output to this node's input.
```

### Payment Rejected

```
Payment was not accepted. Status: 400

Error: Amount mismatch

Check mock server logs for details.
```

## Advanced Usage

### Dynamic URLs

Use expressions in Resource URL:

```
https://api.example.com/{{$json.endpoint}}
```

### Conditional Payment Limits

Different limits based on conditions:

```
[IF] User is premium?
    ├─ YES → [Client] Max: 5.00
    └─ NO → [Client] Max: 0.10
```

### Batch Requests

Call multiple endpoints with same wallet:

```
[Wallet Manager]
    ↓
[Client 1] API A (0.01 USDC)
    ↓
[Client 2] API B (0.02 USDC)
    ↓
[Client 3] API C (0.05 USDC)
    ↓
Total spent: 0.08 USDC from same wallet
```

### Pass-Through Headers

Forward headers from trigger:

```javascript
// In Headers configuration
Name: {
  {
    $json.headerName;
  }
}
Value: {
  {
    $json.headerValue;
  }
}
```

## What's Next?

- [Wallet Manager](/api/wallets/) - Wallet configuration
- [Payment Concepts](/api/payment/) - Understanding payments
- [Examples](/examples/basic-payment/) - See it in action
- [Error Handling](/examples/error-handling/) - Handle failures
