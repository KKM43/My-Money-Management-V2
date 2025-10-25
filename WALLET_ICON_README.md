# Wallet Icon Implementation

This document explains how to use the wallet icon as your app logo, consistent with the LoginScreen design.

## What's Been Implemented

### 1. WalletIcon Component (`components/WalletIcon.js`)
- Reusable wallet icon component using Ionicons
- Consistent styling with LoginScreen
- Configurable size, color, and background
- Shadow effects matching the original design

### 2. Updated LoginScreen (`screens/LoginScreen.js`)
- Now uses the WalletIcon component instead of direct Ionicons
- Maintains the same visual appearance
- More maintainable and consistent

### 3. SVG Wallet Icon (`assets/wallet-icon.svg`)
- High-quality SVG wallet icon (1024x1024)
- Designed to match Ionicons wallet style
- Ready to convert to PNG for app icons

### 4. Helper Scripts
- `scripts/generate-wallet-icon.js` - Instructions for creating wallet icons
- `scripts/update-app-icons.js` - Instructions for updating app icons
- `wallet-icon-preview.html` - Visual preview of wallet icon design

## How to Use the Wallet Icon as App Logo

### Step 1: Convert SVG to PNG
You have several options:

**Online Converters:**
- [Convertio](https://convertio.co/svg-png/)
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG to PNG](https://svgtopng.com/)

**Command Line (if you have the tools):**
```bash
# Using Inkscape
inkscape --export-png=icon.png --export-width=1024 assets/wallet-icon.svg

# Using ImageMagick
magick assets/wallet-icon.svg -resize 1024x1024 assets/icon.png
```

### Step 2: Create Different Sizes
Create these PNG files in your `assets/` folder:

- `icon.png` - 1024x1024 (main app icon)
- `adaptive-icon.png` - 1024x1024 (Android adaptive icon)
- `splash-icon.png` - 1024x1024 (splash screen)
- `favicon.png` - 32x32 or 64x64 (web favicon)

### Step 3: Test Your App
```bash
expo start
```

## Using WalletIcon Component

```jsx
import WalletIcon from '../components/WalletIcon';

// Basic usage
<WalletIcon />

// Custom size and color
<WalletIcon size={80} color="#667eea" />

// With custom background
<WalletIcon 
  size={60} 
  color="white" 
  backgroundColor="rgba(255, 255, 255, 0.2)"
/>

// Without background
<WalletIcon 
  size={40} 
  color="#333" 
  showBackground={false}
/>
```

## Design Specifications

- **Icon**: Ionicons "wallet" icon
- **Size**: 60px (LoginScreen), configurable
- **Color**: White (LoginScreen), configurable
- **Background**: Semi-transparent white circle
- **Shadow**: Subtle drop shadow for depth
- **Style**: Consistent with app theme

## Files Created/Modified

- ✅ `components/WalletIcon.js` - Reusable wallet icon component
- ✅ `screens/LoginScreen.js` - Updated to use WalletIcon component
- ✅ `assets/wallet-icon.svg` - SVG wallet icon for app logo
- ✅ `scripts/generate-wallet-icon.js` - Icon generation instructions
- ✅ `scripts/update-app-icons.js` - App icon update instructions
- ✅ `wallet-icon-preview.html` - Visual preview

## Next Steps

1. Convert the SVG to PNG format
2. Replace existing icon files in `assets/` folder
3. Test the app to see the new wallet icon logo
4. Use WalletIcon component in other screens for consistency

The wallet icon is now ready to be used as your app logo while maintaining consistency with your LoginScreen design!
