# Import Token Feature

## Overview
The token import feature allows users to add custom ERC20 tokens to their token list if they don't appear automatically but exist in their wallet.

## How it Works

### User Experience
1. **Token Selection**: In the transfer section, click on the token selector
2. **Import Option**: If the desired token is not listed, scroll down to see "Can't find your token?"
3. **Import Button**: Click "Import Token" to open the import dialog
4. **Token Address**: Enter the ERC20 contract address
5. **Validation**: The system fetches token details (name, symbol, decimals, balance)
6. **Import**: Click "Import This Token" to add it to the list
7. **Auto-Selection**: The imported token is automatically selected for transfer

### Technical Features
- **Real-time Validation**: Token address is validated and token information is fetched
- **Balance Checking**: User's balance for the imported token is displayed
- **Session Persistence**: Imported tokens remain available during the session
- **Chain-specific**: Imported tokens are reset when switching networks
- **Visual Indicators**: Imported tokens are marked with a green "Imported" badge
- **Duplicate Prevention**: The same token can't be imported twice

### Safety Features
- **Address Validation**: Only valid Ethereum addresses are accepted
- **Contract Verification**: The system verifies it's a valid ERC20 contract
- **User Guidance**: Clear instructions and warnings about token safety
- **Error Handling**: Comprehensive error messages for invalid or non-existent tokens

## Testing Examples

### Mainnet Tokens (for testing on Ethereum Mainnet)
- **USDC**: `0xA0b86a33E6AFDCA4C44c6e4E8C67A32C0D0FB8E7` (example address)
- **DAI**: `0x6B175474E89094C44Da98b954EedeAC495271d0F` (example address)

### Testnet Tokens (for testing on Sepolia)
- Use any valid ERC20 contract address deployed on the current network

## Code Structure

### Components
- **TokenSelector.tsx**: Main token selection UI with import functionality
- **ImportTokenDialog.tsx**: Modal dialog for importing custom tokens
- **CrossChainSendTokens.tsx**: Parent component managing token state

### Key Features
1. **State Management**: 
   - `importedTokens` array in parent component
   - Combined token list (`allTokens = [...tokens, ...importedTokens]`)
   
2. **Import Flow**:
   - Address validation → Token info fetch → Balance check → Import confirmation
   
3. **Visual Feedback**:
   - Loading states during token validation
   - Success/error messages
   - Visual badges for imported tokens

## User Guidance
The UI includes helpful hints:
- "Can't find your token?" message
- "Import it using the contract address" instruction
- Safety warnings about trusting token contracts
- Session-only storage notice

This feature significantly improves the user experience by allowing access to any ERC20 token on the current network, not just the pre-configured ones.
