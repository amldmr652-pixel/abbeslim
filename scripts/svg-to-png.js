const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'app-icon.svg');
const pngPath = path.join(__dirname, '..', 'public', 'app-icon.png');

sharp(svgPath, { density: 300 })
  .resize(1024, 1024)
  .png()
  .toFile(pngPath)
  .then(() => console.log('PNG created:', pngPath))
  .catch(err => console.error('Error:', err));
