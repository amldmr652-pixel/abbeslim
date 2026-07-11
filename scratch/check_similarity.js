const fs = require('fs');
const path = require('path');

// Read env
const envPath = 'c:/Users/I-MEE/Documents/notefinder/.env.local';
let apiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text }] },
      }),
    }
  );
  const data = await response.json();
  return data?.embedding?.values ?? [];
}

async function run() {
  const query = 'vapur';
  const docText = `tı odaları boyunca seğirtiyorlardı, bavullar ve çiçekler taşınıyordu, çocuklar merakla merdivenlerden aşağı yukarı koşmaktaydılar ve bu arada orkestra da hiç istifini bozmaksızın güverte konserini veriyordu. Ben, bu kalabalığın biraz uzağında, gezinti güvertesinde durmuş, bir tanıdığımla konuşuyordu`;

  console.log('Generating embeddings...');
  const vecQuery = await getEmbedding(query);
  const vecDoc = await getEmbedding(docText);

  const sim = cosineSimilarity(vecQuery, vecDoc);
  console.log(`Cosine Similarity between "${query}" and Chess chunk:`, sim);
}

run();
