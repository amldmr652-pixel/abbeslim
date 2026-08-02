const fs = require('fs');
const path = require('path');

const srcIcon = 'C:/Users/I-MEE/.gemini/antigravity/brain/1ddc6337-fb42-43f0-b410-c2ab7661d742/abbeslim_app_icon_1784620242403.jpg';
const srcSplash = 'C:/Users/I-MEE/.gemini/antigravity/brain/1ddc6337-fb42-43f0-b410-c2ab7661d742/abbeslim_app_splash_1784620253444.jpg';

const destDir = path.resolve(__dirname, '../resources');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Copying assets...');
fs.copyFileSync(srcIcon, path.join(destDir, 'icon.png'));
fs.copyFileSync(srcSplash, path.join(destDir, 'splash.png'));

console.log('Copy complete! Files placed in resources/ folder.');
