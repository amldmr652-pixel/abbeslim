import { supabase, supabaseAdmin } from './supabase';

export interface FileRecord {
  id: string;                    // uuid
  name: string;                  // kullanıcının verdiği isim
  categoryId: string;
  date: string;                  // YYYY-MM-DD
  type: string;                  // MIME type (application/pdf, video/mp4 vb.)
  url: string;                   // /uploads/uuid.ext (Supabase public url)
  extractedText: string;         // PDF'ten çıkarılan metin ([PAGE: X] işaretli)
  createdAt: string;             // ISO tarih
  embedding: number[];           // dosyanın genel anlam vektörü
  chunks: {                      // metin parçaları ve vektörleri
    text: string;
    embedding: number[];
  }[];
  isDeleted?: boolean;
  deletedAt?: string;            // ISO tarih
  previousCategory?: string;     // Kategori silinince önceki kategori ID'si
  user_id?: string;              // Supabase auth user ID
}

export async function getDb() {
  try {
    const { data: filesData, error: filesError } = await supabase.from('files').select('*');
    if (filesError) throw filesError;
    
    const { data: catsData, error: catsError } = await supabase.from('categories').select('*');
    if (catsError) throw catsError;

    return {
      files: filesData || [],
      categories: catsData || []
    };
  } catch (err) {
    console.error('getDb Supabase Hatası:', err);
    return { categories: [], files: [] };
  }
}

export async function addFile(record: FileRecord) {
  const { error } = await supabaseAdmin.from('files').insert(record);
  if (error) {
    console.error('Supabase addFile Hatası:', error);
    throw error;
  }
}

export async function deleteFile(id: string) {
  const { error } = await supabase.from('files').update({ isDeleted: true }).eq('id', id);
  if (error) {
    console.error('Supabase deleteFile Hatası:', error);
    return false;
  }
  return true;
}

export async function trashFile(id: string) {
  const { error } = await supabase.from('files')
    .update({ 
      isDeleted: true, 
      deletedAt: new Date().toISOString() 
    })
    .eq('id', id);
  
  if (error) {
    console.error('Supabase trashFile Hatası:', error);
    return false;
  }
  return true;
}

export async function restoreFile(id: string) {
  const { error } = await supabase.from('files')
    .update({ 
      isDeleted: false, 
      deletedAt: null 
    })
    .eq('id', id);
    
  if (error) {
    console.error('Supabase restoreFile Hatası:', error);
    return false;
  }
  return true;
}

export async function permanentlyDeleteFile(id: string) {
  // 1. Önce dosya bilgisini bul (URL'sini almak için)
  const { data: file } = await supabase.from('files').select('url').eq('id', id).single();
  
  // 2. Veritabanından sil
  const { error } = await supabase.from('files').delete().eq('id', id);
  if (error) {
    console.error('Supabase permanentlyDeleteFile Hatası:', error);
    return false;
  }

  // 3. Storage'dan sil (Eğer Supabase'e yüklendiyse)
  if (file && file.url) {
    try {
      const urlParts = file.url.split('/');
      const fileName = urlParts[urlParts.length - 1]; // uuid.ext
      await supabase.storage.from('uploads').remove([fileName]);
    } catch (err) {
      console.error('Storage silme hatası:', err);
    }
  }

  return true;
}

export async function renameFile(id: string, newName: string) {
  const { error } = await supabase.from('files').update({ name: newName }).eq('id', id);
  if (error) {
    console.error('Supabase renameFile Hatası:', error);
    return false;
  }
  return true;
}
