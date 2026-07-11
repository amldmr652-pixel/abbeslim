const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const question = "satranç kitabını özetle";
  
  const sourceText = `[KAYNAK 1 - Satranç.pdf, Sayfa 16]:
ve birden o zamana kadar hiç hissetmediğim bir şeyi hissettim: derin bir yalnızlık ve boşluk. Satranç tahtasının başına oturduğumda kendimi başka bir dünyada buluyordum.

[KAYNAK 2 - Satranç.pdf, Sayfa 18]:
Dr. B. nihayet serbest bırakıldığında, satranç oynaması kesinlikle yasaklanmıştı. Ama o zihninde oynamaya devam etti. Bu onun kurtuluşu olduğu kadar felaketi de oldu.

[KAYNAK 3 - Satranç.pdf, Sayfa 1]:
Stefan Zweig - Satranç. Bu kitap, insanın iç dünyasındaki savaşı, yalnızlığı ve bir tutkunun insanı nasıl esir alabileceğini anlatır.`;

  const userMessage = `Aşağıdaki kaynaklar kullanıcının yüklediği PDF belgelerinden alınmıştır:\n\n${sourceText}\n\nKULLANICI SORUSU: ${question}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  
  // Test with larger maxOutputTokens (8192)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcının yüklediği PDF belgelerine dayalı sorulara yardımcı olursun.
- PDF kaynaklardan gelen bilgileri kullanırken hangi kaynaktan (dosya adı ve sayfa) aldığını belirt.
- Kesinlikle PDF kaynaklarında olmayan bilgileri uydurma.`,
          }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    });

    const data = await res.json();
    console.log('--- Test with maxOutputTokens 8192 ---');
    console.log('Text response:', data?.candidates?.[0]?.content?.parts?.[0]?.text);
    console.log('Finish Reason:', data?.candidates?.[0]?.finishReason);
    console.log('Usage:', data?.usageMetadata);
  } catch (err) {
    console.error(err);
  }

  // Test with thinkingBudget = 0 to disable thinking (making it faster/saving tokens)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcının yüklediği PDF belgelerine dayalı sorulara yardımcı olursun.
- PDF kaynaklardan gelen bilgileri kullanırken hangi kaynaktan (dosya adı ve sayfa) aldığını belirt.
- Kesinlikle PDF kaynaklarında olmayan bilgileri uydurma.`,
          }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 0
          }
        },
      }),
    });

    const data = await res.json();
    console.log('\n--- Test with thinkingBudget = 0 ---');
    console.log('Text response:', data?.candidates?.[0]?.content?.parts?.[0]?.text);
    console.log('Finish Reason:', data?.candidates?.[0]?.finishReason);
    console.log('Usage:', data?.usageMetadata);
  } catch (err) {
    console.error(err);
  }
}

test();
