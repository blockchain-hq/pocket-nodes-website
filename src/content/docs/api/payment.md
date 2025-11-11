---
title: Payment Methods
description: API reference for payment creation and handling
---


API reference for creating and handling payments in x402test.

## Payment Creation

### createPayment(wallet, requirements)

Creates and submits a Solana SPL token transfer transaction.

```typescript
import { createPayment, getWallet } from "x402test";

const wallet = await getWallet();
const signature = await createPayment(wallet, requirements);
```

**Parameters:**

- `wallet` (TestWallet): Test wallet to pay from
- `requirements` (PaymentRequirements): Payment requirements from 402 response

**Returns:** `Promise<string>` - Transaction signature

**Throws:** `PaymentCreationError` if payment fails

### createXPaymentHeader(signature, requirements, from)

Creates the X-PAYMENT header value for the request.

```typescript
import { createXPaymentHeader } from "x402test";

const header = createXPaymentHeader(
  signature,
  requirements,
  wallet.publicKey.toBase58()
);
```

**Parameters:**

- `signature` (string): Solana transaction signature
- `requirements` (PaymentRequirements): Payment requirements
- `from` (string): Payer wallet address

**Returns:** `string` - Base64-encoded X-PAYMENT header value

## Payment Parsing

### parse402Response(body)

Parses a 402 Payment Required response.

```typescript
import { parse402Response } from "x402test";

const response = await fetch(url);
if (response.status === 402) {
  const body = await response.json();
  const requirements = parse402Response(body);

  console.log("Amount:", requirements.maxAmountRequired);
  console.log("Pay to:", requirements.payTo);
}
```

**Parameters:**

- `body` (unknown): Response body from 402 request

**Returns:** `PaymentRequirements`

**Throws:** `X402ParseError` if invalid format

### parse402PaymentHeader(header)

Parses an X-PAYMENT header.

```typescript
import { parse402PaymentHeader } from "x402test";

const payment = parse402PaymentHeader(req.headers["x-payment"]);

console.log("Signature:", payment.payload.signature);
console.log("From:", payment.payload.from);
console.log("Amount:", payment.payload.amount);
```

**Parameters:**

- `header` (string): Base64-encoded X-PAYMENT header

**Returns:** `PaymentPayload`

**Throws:** `X402ParseError` if invalid format

### parseXPaymentResponse(header)

Parses an X-PAYMENT-RESPONSE header.

```typescript
import { parseXPaymentResponse } from "x402test";

const result = parseXPaymentResponse(
  response.headers.get("x-payment-response")
);

console.log("Success:", result.success);
console.log("TX Hash:", result.txHash);
console.log("Network:", result.networkId);
```

**Parameters:**

- `header` (string): Base64-encoded X-PAYMENT-RESPONSE header

**Returns:** Object with `{ success, error, txHash, networkId }`

## Type Definitions

### PaymentRequirements

```typescript
interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  outputSchema?: object;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset: string;
  extra?: object;
}
```

### PaymentPayload

```typescript
interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: SolanaPaymentPayload;
}

interface SolanaPaymentPayload {
  signature: string;
  from: string;
  amount: string;
  mint: string;
  timestamp: number;
}
```

### PaymentRequiredResponse

```typescript
interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirements[];
  error?: string | null;
}
```

## Complete Example

```typescript
import {
  x402,
  parse402Response,
  createPayment,
  createXPaymentHeader,
  getWallet,
} from "x402test";

async function manualPayment(url: string) {
  // 1. Make initial request
  const response = await fetch(url);

  if (response.status === 402) {
    // 2. Parse requirements
    const body = await response.json();
    const requirements = parse402Response(body);

    // 3. Create payment
    const wallet = await getWallet();
    const signature = await createPayment(wallet, requirements);

    // 4. Create header
    const header = createXPaymentHeader(
      signature,
      requirements,
      wallet.publicKey.toBase58()
    );

    // 5. Retry with payment
    const paidResponse = await fetch(url, {
      headers: { "X-PAYMENT": header },
    });

    return await paidResponse.json();
  }
}

// Or use the automated client
async function automatedPayment(url: string) {
  const response = await x402(url).withPayment("0.01").execute();

  return response.body;
}
```

## Error Handling

### PaymentCreationError

```typescript
import { PaymentCreationError } from "x402test";

try {
  const signature = await createPayment(wallet, requirements);
} catch (error) {
  if (error instanceof PaymentCreationError) {
    console.error("Payment failed:", error.message);
    console.error("Cause:", error.cause);
  }
}
```

### X402ParseError

```typescript
import { X402ParseError } from "x402test";

try {
  const requirements = parse402Response(body);
} catch (error) {
  if (error instanceof X402ParseError) {
    console.error("Parse failed:", error.message);
    if (error.zodError) {
      console.error("Validation errors:", error.zodError.issues);
    }
  }
}
```

## Atomic Units

USDC uses 6 decimal places. Helper for converting:

```typescript
function toAtomicUnits(usdc: string): string {
  return (parseFloat(usdc) * 1e6).toString();
}

function fromAtomicUnits(atomic: string): string {
  return (parseInt(atomic) / 1e6).toFixed(6);
}

// Examples
toAtomicUnits("0.01"); // "10000"
toAtomicUnits("0.10"); // "100000"
toAtomicUnits("1.00"); // "1000000"

fromAtomicUnits("10000"); // "0.010000"
fromAtomicUnits("100000"); // "0.100000"
fromAtomicUnits("1000000"); // "1.000000"
```

## Version Constant

```typescript
import { X402_VERSION } from "x402test";

console.log(X402_VERSION); // 1
```

## Next Steps

- [Verification](/api/verification) - Payment verification
- [Wallets](/api/wallets) - Wallet management
- [Examples](/examples/basic-payment) - Complete examples
