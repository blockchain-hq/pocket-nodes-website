---
title: Wallets
description: API reference for test wallet management
---


API reference for managing test wallets in x402test.

## getWallet()

Gets or creates a test wallet with auto-funded USDC.

```typescript
import { getWallet } from "x402test";

const wallet = await getWallet();

console.log("Address:", wallet.publicKey.toBase58());
console.log("Balance:", wallet.balance, "USDC");
console.log("Token Account:", wallet.tokenAccount.toBase58());
```

**Returns:** `Promise<TestWallet>`

**Notes:**

- Creates wallet on first call
- Automatically funds with 10 SOL and 1000 USDC
- Saves wallet to `.x402test-wallets.json`
- Reuses existing wallet on subsequent calls

## TestWallet

```typescript
interface TestWallet {
  keypair: Keypair;
  publicKey: PublicKey;
  tokenAccount: PublicKey;
  usdcMint: PublicKey;
  balance: number;
}
```

**Properties:**

- `keypair` (Keypair): Solana keypair for signing
- `publicKey` (PublicKey): Wallet public key
- `tokenAccount` (PublicKey): USDC token account address
- `usdcMint` (PublicKey): USDC mint address
- `balance` (number): USDC balance

## getUsdcMint()

Gets the USDC mint address.

```typescript
import { getUsdcMint } from "x402test";

const usdcMint = getUsdcMint();
console.log("USDC Mint:", usdcMint.toBase58());
```

**Returns:** `PublicKey`

**Throws:** Error if USDC mint not initialized

## resetWallets()

Resets all wallets and creates new ones.

```typescript
import { resetWallets } from "x402test";

await resetWallets();
console.log("Wallets reset - new wallets created");
```

**Returns:** `Promise<void>`

**Notes:**

- Deletes `.x402test-wallets.json`
- Next `getWallet()` call creates fresh wallets
- Useful for testing isolation

## Using Wallets

### Making Payments

```typescript
import { getWallet, createPayment } from "x402test";

const wallet = await getWallet();
const signature = await createPayment(wallet, requirements);
```

### Checking Balance

```typescript
const wallet = await getWallet();

if (wallet.balance < 1) {
  console.warn("Low balance:", wallet.balance, "USDC");
}
```

### Multiple Wallets

```typescript
import { getWallet, resetWallets } from "x402test";

// Get first wallet
const wallet1 = await getWallet();
console.log("Wallet 1:", wallet1.publicKey.toBase58());

// Reset and get new wallet
await resetWallets();
const wallet2 = await getWallet();
console.log("Wallet 2:", wallet2.publicKey.toBase58());
```

## Wallet Persistence

Wallets are saved to `.x402test-wallets.json`:

```json
{
  "wallets": [
    {
      "publicKey": "FcxKSp7YxqYXdq...",
      "secretKey": [...],
      "tokenAccounts": {
        "USDC": "EPjFWdd5AufqSSqeM2..."
      }
    }
  ],
  "mints": {
    "USDC": "EPjFWdd5AufqSSqeM2..."
  }
}
```

**Security Note:** This file contains private keys. Never commit to version control!

Add to `.gitignore`:

```
.x402test-wallets.json
```

## Wallet Configuration

Wallets are automatically configured with:

- **SOL Balance**: 10 SOL (for transaction fees)
- **USDC Balance**: 1000 USDC (for payments)
- **Network**: Solana devnet or localnet
- **Token Program**: SPL Token Program

## Manual Wallet Usage

### Creating Transactions

```typescript
import { getWallet } from "x402test";
import { Transaction, SystemProgram } from "@solana/web3.js";
import { getConnection } from "x402test";

const wallet = await getWallet();
const connection = getConnection();

// Create custom transaction
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: recipient,
    lamports: 1000000,
  })
);

// Sign and send
const signature = await sendAndConfirmTransaction(connection, transaction, [
  wallet.keypair,
]);
```

### Token Operations

```typescript
import { getWallet, getUsdcMint } from "x402test";
import { getAccount } from "@solana/spl-token";
import { getConnection } from "x402test";

const wallet = await getWallet();
const connection = getConnection();

// Get token account info
const tokenAccount = await getAccount(connection, wallet.tokenAccount);

console.log("Balance:", tokenAccount.amount);
console.log("Mint:", tokenAccount.mint.toBase58());
console.log("Owner:", tokenAccount.owner.toBase58());
```

## Connection Management

### getConnection()

Gets the Solana connection instance.

```typescript
import { getConnection } from "x402test";

const connection = getConnection();
const balance = await connection.getBalance(wallet.publicKey);
```

**Parameters:**

- `rpcUrl` (string, optional): Custom RPC URL

**Returns:** `Connection`

### setRpcUrl()

Changes the RPC URL.

```typescript
import { setRpcUrl } from "x402test";

setRpcUrl("https://api.devnet.solana.com");
```

**Parameters:**

- `rpcUrl` (string): New RPC URL

### getRpcUrl()

Gets the current RPC URL.

```typescript
import { getRpcUrl } from "x402test";

console.log("RPC URL:", getRpcUrl());
```

**Returns:** `string`

## Complete Example

```typescript
import {
  getWallet,
  getUsdcMint,
  createPayment,
  verifyPayment,
  resetWallets,
} from "x402test";

async function testWallets() {
  // Get wallet
  const wallet = await getWallet();
  console.log("Address:", wallet.publicKey.toBase58());
  console.log("Balance:", wallet.balance, "USDC");

  // Get USDC mint
  const usdcMint = getUsdcMint();
  console.log("USDC Mint:", usdcMint.toBase58());

  // Create payment
  const signature = await createPayment(wallet, requirements);
  console.log("Payment signature:", signature);

  // Verify payment
  const result = await verifyPayment(signature, recipient, amount, usdcMint);

  console.log("Verified:", result.isValid);

  // Reset for next test
  await resetWallets();
}
```

## Troubleshooting

### Insufficient Balance

```typescript
const wallet = await getWallet();

if (wallet.balance < requiredAmount) {
  // Reset to get fresh funded wallet
  await resetWallets();
  const newWallet = await getWallet();
  console.log("New balance:", newWallet.balance);
}
```

### Connection Issues

```typescript
import { setRpcUrl, getConnection } from "x402test";

// Try different RPC
setRpcUrl("https://api.devnet.solana.com");

const connection = getConnection();
try {
  await connection.getLatestBlockhash();
  console.log("Connection OK");
} catch (error) {
  console.error("Connection failed:", error);
}
```

### Wallet File Corruption

```bash
rm .x402test-wallets.json
```

Then run your tests again to create fresh wallets.

## Best Practices

1. **Add to .gitignore**: Never commit wallet files
2. **Reset Between Tests**: Use `resetWallets()` for test isolation
3. **Check Balances**: Verify sufficient funds before payments
4. **Use Local Validator**: Faster and more reliable than devnet
5. **Clean Up**: Delete wallet files after testing

## Next Steps

- [Payment Methods](/api/payment) - Creating payments
- [Verification](/api/verification) - Verifying payments
- [Examples](/examples/basic-payment) - Complete examples
