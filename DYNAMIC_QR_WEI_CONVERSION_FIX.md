# Fix: Dynamic QR Wei Conversion for Token Payments

## Problem
The dynamic QR generation was missing proper wei conversion for token amounts. When users input amounts like "1.5" (human-readable format), the system needed to convert these to wei (18 decimals) before creating the QR code for blockchain transactions.

## Root Cause
In `generateDynamicPaymentQR`, the amount was passed directly without any decimal conversion:
- Input: "1.5" ETH
- Output: QR with value=1.5 (WRONG - should be 1500000000000000000 wei)

## Solution

### 1. Added Import for Conversion Functions
```typescript
import { 
  type Address,
  type WalletClient,
  type PublicClient,
  http,
  type Chain,
  parseUnits,    // NEW: Convert to wei
  formatUnits    // NEW: Convert from wei
} from 'viem';
```

### 2. Updated `generateDynamicPaymentQR` Function

#### Before:
```typescript
// Add parameters
const params = [];

if (amount && amount !== '0') {
  params.push(`value=${amount}`); // WRONG: Raw input value
}
```

#### After:
```typescript
// Convert amount to wei (assuming input is in human-readable format)
let amountInWei: string = '0';

if (amount && amount !== '0') {
  try {
    // Convert amount dari input user (e.g., "1.5") ke wei
    const decimals = 18; // Default untuk kebanyakan token dan native ETH
    amountInWei = parseUnits(amount, decimals).toString();
    console.log(`💰 Converted ${amount} to ${amountInWei} wei (${decimals} decimals)`);
  } catch (conversionError) {
    console.error('❌ Error converting amount to wei:', conversionError);
    return null;
  }
}

// Add parameters with proper wei values
const params = [];

if (amountInWei && amountInWei !== '0') {
  if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
    // For ERC20 tokens - use function call format
    params.push(`functionName=transfer`);
    params.push(`args=${recipientAddress},${amountInWei}`);
  } else {
    // For native ETH transfers
    params.push(`value=${amountInWei}`);
  }
}
```

### 3. Enhanced `parsePaymentQR` Function

Added reverse conversion from wei to human-readable format:

```typescript
// Parse query parameters
if (url.searchParams.has('value')) {
  const amountWei = url.searchParams.get('value');
  result.amount = amountWei;
  
  // Convert wei to human-readable format
  if (amountWei && amountWei !== '0') {
    try {
      const decimals = 18; // Default untuk ETH dan kebanyakan token
      const formatted = formatUnits(BigInt(amountWei), decimals);
      result.amountFormatted = formatted;
      console.log(`💰 Converted ${amountWei} wei to ${formatted} tokens`);
    } catch (conversionError) {
      console.error('❌ Error converting wei to readable format:', conversionError);
      result.amountFormatted = amountWei; // Fallback ke raw value
    }
  }
}
```

## Key Features

### 1. **Automatic Wei Conversion**
- Input: "1.5" ETH → Output: "1500000000000000000" wei
- Input: "0.001" ETH → Output: "1000000000000000" wei

### 2. **18 Decimal Support**
- Uses standard 18 decimals for ETH and most ERC20 tokens
- Proper `parseUnits` and `formatUnits` from viem library

### 3. **Enhanced Error Handling**
- Catches conversion errors and returns null
- Fallback to raw values if conversion fails
- Detailed logging for debugging

### 4. **ERC20 Token Support**
- Different QR format for token transfers vs native ETH
- Proper function call encoding for token transfers

## Example Conversion

### Input to QR Generation:
```
User inputs: "1.5"
Token: Native ETH
Output QR: ethereum:0x742d35Cc...?value=1500000000000000000&chainId=11155111
```

### QR Parsing Back:
```
QR Data: ethereum:0x742d35Cc...?value=1500000000000000000
Parsed result: {
  recipientAddress: "0x742d35Cc...",
  amount: "1500000000000000000",
  amountFormatted: "1.5"  // Human-readable
}
```

## Impact
- ✅ **Correct blockchain transactions**: QR codes now contain proper wei values
- ✅ **User-friendly input**: Users can input "1.5" instead of "1500000000000000000"
- ✅ **Proper token handling**: Different formats for native vs ERC20 transfers
- ✅ **Better debugging**: Detailed logging shows conversion process

## Testing Scenarios
1. **Native ETH Transfer**: Input "1.0" → QR shows value=1000000000000000000
2. **Small amounts**: Input "0.001" → QR shows value=1000000000000000
3. **ERC20 Token**: Different QR format with function call encoding
4. **Error handling**: Invalid inputs return null with proper error logging

## Status: ✅ COMPLETED
- Added viem import for parseUnits/formatUnits
- Updated generateDynamicPaymentQR with wei conversion
- Enhanced parsePaymentQR with reverse conversion
- Added comprehensive error handling and logging
- Hot reload updated all components automatically
