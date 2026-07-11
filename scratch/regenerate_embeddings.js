const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Env yükle
const envPath = 'c:/Users/I-MEE/Documents/notefinder/.env.local';
let supabaseUrl = '';
let serviceRoleKey = '';
let geminiApiKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const getVal = (key) => {
    const m = envContent.match(new RegExp(`${key}\\s*=\\s*([^\\r\\n]+)`));
    return m ? m[1].trim() : '';
  };
  supabaseUrl = getVal('NEXT_PUBLIC_SUPABASE_URL');
  serviceRoleKey = getVal('SUPABASE_SERVICE_ROLE_KEY');
  geminiApiKey = getVal('GEMINI_API_KEY');
}

if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
  console.error('Eksik env değişkenleri. Lütfen .env.local dosyasını kontrol edin.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const delay = ms => new Promise(r => setTimeout(r, ms));

// Gemini embedding fonksiyonu
async function getEmbedding(text) {
  // Free tier RPM limitlerini aşmamak için bekleme ekle (4.5 saniye)
  await delay(4500);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text: text.substring(0, 2048) }] },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini Error:`, response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return data?.embedding?.values ?? [];
  } catch (e) {
    console.error('Fetch error:', e);
    return [];
  }
}

async function run() {
  console.log('Veritabanındaki dosyalar çekiliyor...');
  const { data: rawFiles, error } = await supabaseAdmin.from('files').select('*');
  if (error) {
    console.error('Dosyalar çekilemedi:', error);
    return;
  }

  // Sadece gerçek dökümanları seçelim (2000 karakterden uzun olanlar)
  const files = rawFiles.filter(f => f.extractedText && f.extractedText.trim().length > 2000);
  console.log(`Toplam ${rawFiles.length} dosyadan anlamsal güncelleme yapılacak ${files.length} gerçek dosya belirlendi.`);

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    console.log(`\n[${idx + 1}/${files.length}] İşleniyor: ${file.name}`);

    // YENİ: Büyük chunk boyutuyla yeniden oluşturmak için atlamayı devre dışı bıraktık
    /*
    if (file.embedding && file.embedding.length === 3072 && file.chunks && file.chunks.length > 0) {
      console.log('-> Bu dosya zaten güncel embeddinglere sahip. Atlanıyor...');
      continue;
    }
    */

    const text = file.extractedText || '';
    if (!text.trim()) {
      console.log('-> Metin bulunamadı. Boş geçiliyor.');
      continue;
    }

    console.log(`-> Metin uzunluğu: ${text.length}. Vektörler üretiliyor...`);
    const embedding = await getEmbedding(text.substring(0, 2048));
    if (embedding.length === 0) {
      console.log('-> Genel embedding üretilemedi. Dosya atlanıyor.');
      continue;
    }

    const chunks = [];
    const chunkSize = 2000;
    const maxChunks = 20;
    let chunkCount = 0;
    for (let i = 0; i < text.length && chunkCount < maxChunks; i += chunkSize) {
      const chunkText = text.substring(i, i + chunkSize);
      if (chunkText.trim().length > 20) {
        const chunkEmbedding = await getEmbedding(chunkText);
        if (chunkEmbedding.length > 0) {
          chunks.push({ text: chunkText, embedding: chunkEmbedding });
        }
        chunkCount++;
      }
    }

    console.log(`-> ${chunks.length} adet chunk vektörü başarıyla üretildi. Veritabanı güncelleniyor...`);
    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({ embedding, chunks })
      .eq('id', file.id);

    if (updateError) {
      console.error('-> Güncelleme hatası:', updateError);
    } else {
      console.log('-> Veritabanı başarıyla güncellendi.');
    }
  }

  console.log('\nİşlem tamamlandı!');
}

run();
