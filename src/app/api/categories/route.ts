import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Kullanıcı kimliğini doğrula
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { data: categories, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    
    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Kategori listeleme hatası:', error);
    return NextResponse.json({ error: 'Kategoriler alınamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const body = await request.json();

    if (body.action === 'add') {
      const newId = body.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-ğüşıöçĞÜŞİÖÇ]/g, '')
        + '-' + Date.now();
        
      const newCat = { id: newId, name: body.name, parentId: body.parentId || null, user_id: user.id };
      
      const { error } = await supabase.from('categories').insert(newCat);
      if (error) throw error;
      
      return NextResponse.json({ success: true, category: newCat });
    }

    if (body.action === 'update') {
      const updateData: any = {};
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.parentId !== undefined) {
        updateData.parentId = body.parentId || null;
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Güncellenecek veri sağlanmadı.' }, { status: 400 });
      }

      const { error } = await supabase.from('categories')
        .update(updateData)
        .eq('id', body.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 });
  } catch (error) {
    console.error('Kategori POST hatası:', error);
    return NextResponse.json({ error: 'Kategori işleminde hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

    // Önce 'diger' kategorisinin var olduğunu garantile
    const { data: digerCat } = await supabase.from('categories').select('id').eq('id', `diger-${user.id}`).single();
    
    const digerId = `diger-${user.id}`;
    if (!digerCat) {
      await supabase.from('categories').insert({ id: digerId, name: 'Diğer', parentId: null, user_id: user.id });
    }

    // Bu kategorideki dosyaları 'diger'e taşı
    const { data: movedFiles } = await supabase.from('files')
      .update({ categoryId: digerId, previousCategory: id })
      .eq('categoryId', id)
      .eq('user_id', user.id)
      .select();
      
    const movedCount = movedFiles ? movedFiles.length : 0;

    // Alt kategorileri kök dizine taşı
    await supabase.from('categories')
      .update({ parentId: null })
      .eq('parentId', id)
      .eq('user_id', user.id);

    // Kategoriyi kaldır
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, movedCount });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    return NextResponse.json({ error: 'Kategori silinirken hata oluştu.' }, { status: 500 });
  }
}
