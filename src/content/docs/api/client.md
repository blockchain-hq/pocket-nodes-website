---
title: x402() Client
description: Complete API reference for the x402test client
---


Complete API reference for the x402test HTTP client.

## Import

```typescript
import { x402, request, X402Request } from "x402test";
```

## Constructor

### x402(url: string)

Creates a new x402 request instance.

```typescript
const req = x402("http://localhost:4402/api/data");
```

**Parameters:**

- `url` (string): The URL to make the request to

**Returns:** `X402Request` instance

**Aliases:** `request(url)`

## HTTP Methods

### get()

Sets the HTTP method to GET.

```typescript
x402(url).get().execute();
```

**Returns:** `this` (chainable)

### post(body?: unknown)

Sets the HTTP method to POST with optional body.

```typescript
x402(url).post({ key: "value" }).execute();
```

**Parameters:**

- `body` (unknown, optional): Request body

**Returns:** `this` (chainable)

### put(body?: unknown)

Sets the HTTP method to PUT with optional body.

```typescript
x402(url).put({ key: "updated" }).execute();
```

**Parameters:**

- `body` (unknown, optional): Request body

**Returns:** `this` (chainable)

### delete()

Sets the HTTP method to DELETE.

```typescript
x402(url).delete().execute();
```

**Returns:** `this` (chainable)

## Headers

### header(name: string, value: string)

Sets a single request header.

```typescript
x402(url).header("Content-Type", "application/json").execute();
```

**Parameters:**

- `name` (string): Header name
- `value` (string): Header value

**Returns:** `this` (chainable)

### headers(headers: Record<string, string>)

Sets multiple request headers.

```typescript
x402(url)
  .headers({
    "Content-Type": "application/json",
    Authorization: "Bearer token",
  })
  .execute();
```

**Parameters:**

- `headers` (Record<string, string>): Object of header key-value pairs

**Returns:** `this` (chainable)

## Body

### body(body: unknown)

Sets the request body.

```typescript
x402(url).body({ key: "value" }).execute();
```

**Parameters:**

- `body` (unknown): Request body (will be JSON stringified)

**Returns:** `this` (chainable)

## Payment

### withPayment(config: string | { amount: string })

Specifies the maximum amount willing to pay.

```typescript
// String amount
x402(url).withPayment("0.01").execute();

// Object with amount
x402(url).withPayment({ amount: "0.01" }).execute();
```

**Parameters:**

- `config` (string | object): Payment amount in USDC

**Returns:** `this` (chainable)

**Notes:**

- Amount should be in USDC (e.g., "0.01" for 1 cent)
- Client will automatically convert to atomic units
- Must be >= server's required amount

## Expectations

### expectStatus(status: number)

Asserts the response status code.

```typescript
await x402(url).withPayment("0.01").expectStatus(200).execute();
```

**Parameters:**

- `status` (number): Expected HTTP status code

**Returns:** `this` (chainable)

**Throws:** `AssertionError` if status doesn't match

### expectPaymentSettled()

Verifies the payment transaction is confirmed on-chain.

```typescript
await x402(url).withPayment("0.01").expectPaymentSettled().execute();
```

**Returns:** `this` (chainable)

**Throws:** `PaymentVerificationError` if payment verification fails

### expectPaymentAmount(amount: string)

Verifies the exact payment amount in atomic units.

```typescript
await x402(url)
  .withPayment("0.01")
  .expectPaymentAmount("10000") // 0.01 USDC in atomic units
  .execute();
```

**Parameters:**

- `amount` (string): Expected amount in atomic units

**Returns:** `this` (chainable)

**Throws:** `AssertionError` if amount doesn't match

### expectBody(matcher: unknown | ((body: any) => boolean))

Validates the response body.

```typescript
// Exact match
await x402(url).expectBody({ key: "value" }).execute();

// Custom validation function
await x402(url)
  .expectBody((body) => body.data && body.data.length > 0)
  .execute();
```

**Parameters:**

- `matcher` (unknown | function): Expected body or validation function

**Returns:** `this` (chainable)

**Throws:** `AssertionError` if validation fails

### expectHeader(name: string, value: string | RegExp)

Validates a response header.

```typescript
// Exact match
await x402(url).expectHeader("Content-Type", "application/json").execute();

// Regex match
await x402(url)
  .expectHeader("Content-Type", /application\/json/)
  .execute();
```

**Parameters:**

- `name` (string): Header name
- `value` (string | RegExp): Expected value or pattern

**Returns:** `this` (chainable)

**Throws:** `AssertionError` if header doesn't match

## Execution

### execute<T>()

Executes the request and returns the response.

```typescript
const response = await x402(url)
  .withPayment("0.01")
  .expectStatus(200)
  .execute();
```

**Returns:** `Promise<X402Response<T>>`

**Throws:**

- `X402Error` - General request errors
- `X402ParseError` - Failed to parse 402 response
- `PaymentCreationError` - Failed to create payment
- `PaymentVerificationError` - Payment verification failed
- `AssertionError` - Expectation not met

## Response Type

### X402Response<T>

The response object returned by `execute()`.

```typescript
interface X402Response<T> {
  status: number;
  statusText: string;
  headers: Headers;
  body: T;
  payment?: {
    signature: string;
    amount: string;
    from: string;
    to: string;
  };
}
```

**Properties:**

- `status` (number): HTTP status code
- `statusText` (string): HTTP status text
- `headers` (Headers): Response headers
- `body` (T): Parsed response body
- `payment` (object, optional): Payment details if payment was made

## Complete Example

```typescript
import { x402 } from "x402test";

try {
  const response = await x402("http://localhost:4402/api/premium")
    .post({ userId: "123" })
    .header("X-Custom", "value")
    .withPayment("0.10")
    .expectStatus(200)
    .expectPaymentSettled()
    .expectHeader("Content-Type", "application/json")
    .expectBody((body) => body.success === true)
    .execute();

  console.log("Status:", response.status);
  console.log("Body:", response.body);
  console.log("Payment:", response.payment);
} catch (error) {
  console.error("Error:", error.message);
}
```

## Chaining

All methods except `execute()` return the request instance, allowing method chaining:

```typescript
await x402(url)
  .post({ data: "value" })
  .header("Content-Type", "application/json")
  .headers({ "X-Custom": "header" })
  .body({ additional: "data" })
  .withPayment("0.01")
  .expectStatus(200)
  .expectPaymentSettled()
  .expectBody({ success: true })
  .execute();
```

## Error Handling

### Using try-catch

```typescript
import { X402Error, AssertionError } from "x402test";

try {
  await x402(url).withPayment("0.01").execute();
} catch (error) {
  if (error instanceof X402Error) {
    console.error("Payment error:", error.message);
  } else if (error instanceof AssertionError) {
    console.error("Assertion failed:", error.message);
  }
}
```

### Error Types

All error types are exported:

```typescript
import {
  X402Error,
  X402ParseError,
  PaymentCreationError,
  PaymentVerificationError,
  AssertionError,
} from "x402test";
```

## TypeScript Support

Full TypeScript support with generics:

```typescript
interface ApiResponse {
  data: string;
  timestamp: number;
}

const response = await x402<ApiResponse>(url).withPayment("0.01").execute();

// response.body is typed as ApiResponse
console.log(response.body.data);
console.log(response.body.timestamp);
```

## Next Steps

- [Payment Methods](/api/payment) - Payment creation and handling
- [Verification](/api/verification) - Payment verification
- [Examples](/examples/basic-payment) - Complete examples
