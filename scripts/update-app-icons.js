const fs = require('fs');
const path = require('path');

console.log('App Icon Update Instructions:');
console.log('============================');
console.log('');
console.log('To use the wallet icon as your app logo:');
console.log('');
console.log('1. Convert SVG to PNG:');
console.log('   - Use online converters like:');
console.log('     * convertio.co');
console.log('     * cloudconvert.com');
console.log('     * svgtopng.com');
console.log('   - Or use command line tools:');
console.log('     * Inkscape: inkscape --export-png=icon.png --export-width=1024 wallet-icon.svg');
console.log('     * ImageMagick: magick wallet-icon.svg -resize 1024x1024 icon.png');
console.log('');
console.log('2. Create different sizes:');
console.log('   - icon.png: 1024x1024 (main app icon)');
console.log('   - adaptive-icon.png: 1024x1024 (Android adaptive icon)');
console.log('   - splash-icon.png: 1024x1024 (splash screen)');
console.log('   - favicon.png: 32x32 or 64x64 (web favicon)');
console.log('');
console.log('3. Replace existing files in assets/ folder:');
console.log('   - assets/icon.png');
console.log('   - assets/adaptive-icon.png');
console.log('   - assets/splash-icon.png');
console.log('   - assets/favicon.png');
console.log('');
console.log('4. Test the changes:');
console.log('   - Run: expo start');
console.log('   - Check app icon in device/emulator');
console.log('   - Verify splash screen shows wallet icon');
console.log('');

// Check if assets directory exists
const assetsDir = path.join(__dirname, '..', 'assets');
if (fs.existsSync(assetsDir)) {
  console.log('Current assets directory contents:');
  const files = fs.readdirSync(assetsDir);
  files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.size} bytes)`);
  });
} else {
  console.log('Assets directory not found. Creating...');
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('');
console.log('Next steps:');
console.log('1. Convert assets/wallet-icon.svg to PNG format');
console.log('2. Create different sizes for different use cases');
console.log('3. Replace the existing icon files');
console.log('4. Test your app to see the new wallet icon logo');
