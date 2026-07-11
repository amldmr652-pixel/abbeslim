const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Env yükle
const envPath = 'c:/Users/I-MEE/Documents/notefinder/.env.local';
let supabaseUrl = '';
let serviceRoleKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const getVal = (key) => {
    const m = envContent.match(new RegExp(`${key}\\s*=\\s*([^\\r\\n]+)`));
    return m ? m[1].trim() : '';
  };
  supabaseUrl = getVal('NEXT_PUBLIC_SUPABASE_URL');
  serviceRoleKey = getVal('SUPABASE_SERVICE_ROLE_KEY');
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Eksik env değişkenleri.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function run() {
  const name = 'İnsanlık ve Değerler Test Dökümanı';
  console.log(`Veritabanından "${name}" siliniyor...`);
  
  const { data, error } = await supabaseAdmin
    .from('files')
    .delete()
    .eq('name', name)
    .select();

  if (error) {
    console.error('Silme hatası:', error);
  } else {
    console.log('Başarıyla silindi! Silinen kayıt sayısı:', data.length);
  }
}

run();
