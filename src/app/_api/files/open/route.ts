import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // `user_id` ya da `userId` olabilir projede. (Genelde `userId` kullanılmış migration'larda)
    const { error } = await supabase
      .from('files')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id); 

    if (error) {
      console.error('Error updating last_opened_at:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
