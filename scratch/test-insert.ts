import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testInsert() {
  console.log('Testing insertions into media_tracker...');
  
  // Try inserting a movie
  const { data, error } = await supabase
    .from('media_tracker')
    .insert([
      {
        user_id: '21bc1afc-96c4-480e-92d3-d1df8f0b4cd4',
        title: 'Test Movie Matrix',
        media_type: 'movie',
        status: 'planned',
        rating: 5,
        poster_url: null,
        tmdb_id: '123'
      }
    ])
    .select();
    
  if (error) {
    console.error('Movie insert failed:', error);
  } else {
    console.log('Movie insert succeeded:', data);
    
    // Clean it up
    await supabase.from('media_tracker').delete().eq('id', data[0].id);
    console.log('Cleaned up test movie.');
  }

  // Try inserting a series
  const { data: data2, error: error2 } = await supabase
    .from('media_tracker')
    .insert([
      {
        user_id: '21bc1afc-96c4-480e-92d3-d1df8f0b4cd4',
        title: 'Test Series Dark',
        media_type: 'series',
        status: 'active',
        rating: 4,
        poster_url: null,
        tmdb_id: '456'
      }
    ])
    .select();

  if (error2) {
    console.error('Series insert failed:', error2);
  } else {
    console.log('Series insert succeeded:', data2);
    
    // Clean it up
    await supabase.from('media_tracker').delete().eq('id', data2[0].id);
    console.log('Cleaned up test series.');
  }
}

testInsert();
