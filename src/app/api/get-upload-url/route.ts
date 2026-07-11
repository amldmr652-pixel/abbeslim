import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Kullanıcı doğrulama
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { fileName, fileType } = await request.json();

    // Benzersiz dosya yolu oluştur
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    const fileId = uuidv4();
    const storagePath = `${fileId}${ext}`;

    // Service role ile imzalı yükleme URL'si oluştur (RLS bypass)
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('Signed URL hatası:', error);
      return NextResponse.json({ error: 'URL oluşturulamadı: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
      fileId,
    });
  } catch (err: any) {
    console.error('get-upload-url hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
