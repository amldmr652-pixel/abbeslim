import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

async function testTmdb() {
  console.log('Testing TMDB with API Key:', apiKey);
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=tr-TR&query=Matrix&page=1`);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Results count:', data.results?.length);
    if (data.results && data.results.length > 0) {
      console.log('First result:', data.results[0].title);
    } else {
      console.log('Full response:', data);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testTmdb();
