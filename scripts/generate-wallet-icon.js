// Script to help generate a wallet icon-based logo
// This script provides instructions for creating a wallet icon PNG

const fs = require('fs');
const path = require('path');

console.log('Wallet Icon Logo Generation Instructions:');
console.log('=====================================');
console.log('');
console.log('To create a wallet icon-based logo for your app:');
console.log('');
console.log('1. Use an online icon generator or design tool:');
console.log('   - Canva (canva.com)');
console.log('   - Figma (figma.com)');
console.log('   - Adobe Express (express.adobe.com)');
console.log('   - IconFinder (iconfinder.com)');
console.log('');
console.log('2. Design specifications:');
console.log('   - Size: 1024x1024 pixels (for high resolution)');
console.log('   - Format: PNG with transparent background');
console.log('   - Style: Wallet icon similar to Ionicons wallet');
console.log('   - Colors: Use your app theme colors');
console.log('   - Background: Transparent or solid color');
console.log('');
console.log('3. Alternative: Use existing wallet icon from icon libraries:');
console.log('   - Material Icons');
console.log('   - Feather Icons');
console.log('   - Heroicons');
console.log('');
console.log('4. Save the generated icon as:');
console.log('   - assets/icon.png (main app icon)');
console.log('   - assets/adaptive-icon.png (Android adaptive icon)');
console.log('   - assets/splash-icon.png (splash screen)');
console.log('   - assets/favicon.png (web favicon)');
console.log('');
console.log('5. Recommended wallet icon design:');
console.log('   - Simple wallet outline or filled wallet');
console.log('   - Consistent with Ionicons wallet style');
console.log('   - Professional and recognizable');
console.log('   - Works well at small sizes (app icon)');
console.log('');

// Create a simple HTML file to preview wallet icon
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Wallet Icon Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .icon-preview {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .icon-container {
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        .instructions {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            max-width: 600px;
        }
    </style>
</head>
<body>
    <div class="icon-preview">
        <h1>Wallet Icon Logo Preview</h1>
        <div class="icon-container">
            💳
        </div>
        <div class="instructions">
            <h3>Design Guidelines:</h3>
            <ul>
                <li>Use a wallet or card icon similar to the one above</li>
                <li>Make it 1024x1024 pixels for the main icon</li>
                <li>Use your app's primary colors</li>
                <li>Ensure it's recognizable at small sizes</li>
                <li>Keep it simple and professional</li>
            </ul>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync('wallet-icon-preview.html', htmlContent);
console.log('Created wallet-icon-preview.html for design reference');
