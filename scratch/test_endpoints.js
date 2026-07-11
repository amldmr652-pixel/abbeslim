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

async function testEndpoint(url, modelName) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        content: { parts: [{ text: 'test query' }] },
      }),
    });

    console.log(`URL: ${url}`);
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      const values = data?.embedding?.values ?? [];
      console.log(`Success! Embedding length: ${values.length}`);
      return true;
    } else {
      console.log(`Error:`, await response.text());
      return false;
    }
  } catch (e) {
    console.error(`Fetch error:`, e);
    return false;
  }
}

async function run() {
  console.log('Testing text-embedding-004 on v1...');
  await testEndpoint(
    `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${apiKey}`,
    'models/text-embedding-004'
  );

  console.log('\nTesting text-embedding-004 on v1beta...');
  await testEndpoint(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    'models/text-embedding-004'
  );

  console.log('\nTesting gemini-embedding-001 on v1beta...');
  await testEndpoint(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    'models/gemini-embedding-001'
  );

  console.log('\nTesting text-embedding-004 with short name on v1beta...');
  await testEndpoint(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    'text-embedding-004'
  );
}

run();
