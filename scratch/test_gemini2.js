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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text: 'test query' }] },
        }),
      }
    );

    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      const values = data?.embedding?.values ?? [];
      console.log('Embedding values length:', values.length);
    } else {
      console.log('Error:', await response.text());
    }
  } catch (e) {
    console.error(e);
  }
}

run();
