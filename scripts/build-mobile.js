const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiPath = path.resolve(__dirname, '../src/app/api');
const tempApiPath = path.resolve(__dirname, '../src/app/_api');

let renamed = false;

try {
  // Eğer daha önceki bir hata nedeniyle _api kaldıysa, düzeltelim
  if (fs.existsSync(tempApiPath)) {
    if (fs.existsSync(apiPath)) {
      console.log('Removing leftover _api directory...');
      fs.rmSync(tempApiPath, { recursive: true, force: true });
    } else {
      console.log('Restoring leftover _api to api...');
      fs.renameSync(tempApiPath, apiPath);
    }
  }

  if (fs.existsSync(apiPath)) {
    console.log('Renaming src/app/api to src/app/_api to exclude from static export...');
    fs.renameSync(apiPath, tempApiPath);
    renamed = true;
  } else {
    console.warn('Warning: src/app/api directory not found.');
  }

  // Delet .next directory to clear old typescript route cache
  const nextCachePath = path.resolve(__dirname, '../.next');
  if (fs.existsSync(nextCachePath)) {
    console.log('Cleaning up .next directory for clean build...');
    fs.rmSync(nextCachePath, { recursive: true, force: true });
  }

  console.log('Running Next.js build for mobile target...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      BUILD_TARGET: 'mobile',
      NODE_ENV: 'production'
    }
  });

  console.log('Next.js build finished successfully.');
} catch (error) {
  console.error('Error during build-mobile script execution:', error.message);
  process.exitCode = 1;
} finally {
  if (renamed && fs.existsSync(tempApiPath)) {
    console.log('Restoring src/app/_api back to src/app/api...');
    fs.renameSync(tempApiPath, apiPath);
    console.log('Restored src/app/api successfully.');
  }
}
