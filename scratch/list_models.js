const fs = require('fs');
const path = require('path');

// Read .env.local manually to get API key
const envPath = 'c:/Users/I-MEE/Documents/notefinder/.env.local';
let apiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*([^\r\n]+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

async function run() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (response.ok) {
      const data = await response.json();
      console.log('Available models:');
      for (const m of data.models) {
        if (m.name.includes('embed')) {
          console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
        }
      }
    } else {
      console.log('Error listing models:', await response.text());
    }
  } catch (e) {
    console.error(e);
  }
}

run();
