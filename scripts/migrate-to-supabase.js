import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

// Çevresel değişkenleri yükle (.env.local)
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("HATA: .env.local dosyasında Supabase bilgileri eksik!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Yerel veritabanı (db.json) okunuyor...');
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  
  let db;
  try {
    const raw = await fs.readFile(dbPath, 'utf-8');
    db = JSON.parse(raw);
  } catch (err) {
    console.error('db.json okunamadı veya bulunamadı:', err);
    return;
  }

  const categories = db.categories || [];
  const files = db.files || [];

  console.log(`${categories.length} kategori ve ${files.length} dosya bulundu.`);

  // 1. Kategorileri aktar
  console.log('Kategoriler Supabase\'e aktarılıyor...');
  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId || null
    });
    if (error) {
      console.error(`Kategori aktarılamadı (${cat.name}):`, error.message);
    }
  }
  console.log('Kategoriler başarıyla aktarıldı.');

  // 2. Dosyaları aktar
  console.log('Dosyalar Supabase\'e aktarılıyor... (Bu işlem dosya boyutuna göre birkaç dakika sürebilir)');
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    const record = {
      id: file.id,
      name: file.name,
      categoryId: file.categoryId,
      date: file.date,
      type: file.type,
      url: file.url,
      extractedText: file.extractedText || '',
      createdAt: file.createdAt || new Date().toISOString(),
      embedding: file.embedding || null,
      chunks: file.chunks || null,
      isDeleted: file.isDeleted || false,
      deletedAt: file.deletedAt || null,
      previousCategory: file.previousCategory || null
    };

    const { error } = await supabase.from('files').upsert(record);
    if (error) {
      console.error(`Dosya aktarılamadı (${file.name}):`, error.message);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`${successCount}/${files.length} dosya aktarıldı...`);
      }
    }
  }

  console.log('\n--- AKTARIM ÖZETİ ---');
  console.log(`Toplam Aktarılan Kategori: ${categories.length}`);
  console.log(`Başarıyla Aktarılan Dosya: ${successCount}`);
  console.log(`Hatalı Dosya Sayısı: ${errorCount}`);
  console.log('---------------------\n');
  
  console.log('LÜTFEN DİKKAT: Metin ve vektör verileriniz başarıyla aktarıldı.');
  console.log('Ancak, "public/uploads" içindeki fiziksel PDF dosyalarınızı Supabase arayüzünden Storage -> uploads bucket\'ına elle sürükleyip bırakmanız gerekmektedir.');
}

migrate();
