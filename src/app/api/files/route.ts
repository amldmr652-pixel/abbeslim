import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const body = await request.json();
    const { id, name, categoryId } = body;
    if (!id) {
      return NextResponse.json({ error: 'Geçersiz ID.' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Geçersiz dosya adı.' }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek veri sağlanmadı.' }, { status: 400 });
    }

    const { error } = await supabase.from('files')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dosya güncelleme hatası:', error);
    return NextResponse.json({ error: 'Güncelleme sırasında hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'trash';

    if (action === 'clear_trash') {
      // 1. Get all deleted files for this user
      const { data: trashedFiles, error: fetchError } = await supabase
        .from('files')
        .select('id, url')
        .eq('isDeleted', true)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (!trashedFiles || trashedFiles.length === 0) {
        return NextResponse.json({ success: true, message: 'Çöp kutusu zaten boş.' });
      }

      // 2. Delete them from database
      const idsToDelete = trashedFiles.map(f => f.id);
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // 3. Remove them from Storage
      const filesToRemove = trashedFiles
        .map(f => {
          if (!f.url) return null;
          const urlParts = f.url.split('/');
          return urlParts[urlParts.length - 1];
        })
        .filter((name): name is string => !!name);

      if (filesToRemove.length > 0) {
        try {
          await supabase.storage.from('uploads').remove(filesToRemove);
        } catch (err) {
          console.error('Toplu storage silme hatası:', err);
        }
      }

      return NextResponse.json({ success: true, count: trashedFiles.length });
    }

    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

    if (action === 'trash') {
      const { error } = await supabase.from('files')
        .update({ isDeleted: true, deletedAt: new Date().toISOString() })
        .eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'restore') {
      const { error } = await supabase.from('files')
        .update({ isDeleted: false, deletedAt: null })
        .eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'permanent') {
      const { data: file } = await supabase.from('files').select('url').eq('id', id).eq('user_id', user.id).single();
      const { error } = await supabase.from('files').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      if (file?.url) {
        try {
          const urlParts = file.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('uploads').remove([fileName]);
        } catch (err) {
          console.error('Storage silme hatası:', err);
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 });
  } catch (error) {
    console.error('Dosya işlemi hatası:', error);
    return NextResponse.json({ error: 'İşlem sırasında hata oluştu.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const showTrash = searchParams.get('trash') === 'true';

    const { data: files, error } = await supabase.from('files')
      .select('id, name, categoryId, date, type, url, isDeleted, deletedAt, createdAt')
      .eq('user_id', user.id)
      .eq('isDeleted', showTrash);

    if (error) throw error;
    return NextResponse.json({ files: files || [] });
  } catch (error) {
    console.error('Dosya listeleme hatası:', error);
    return NextResponse.json({ error: 'Dosyalar alınamadı.' }, { status: 500 });
  }
}
