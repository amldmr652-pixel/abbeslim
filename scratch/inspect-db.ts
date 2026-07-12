import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectSchema() {
  console.log('Inspecting schemas...');
  
  // Query to get table information from information_schema
  const { data: cols, error: colsError } = await supabase
    .rpc('get_table_columns', { table_name: 'media_tracker' });
    
  if (colsError) {
    // If RPC doesn't exist, let's try custom query or just select a row and look at keys
    console.log('RPC get_table_columns failed or not defined. Querying 1 row instead.');
    const { data: row, error } = await supabase.from('media_tracker').select('*').limit(1);
    if (error) {
      console.error('Error fetching row:', error);
    } else {
      console.log('Sample row from media_tracker:', row);
    }
  } else {
    console.log('media_tracker columns:', cols);
  }

  // Same for transactions
  const { data: transRow, error: transError } = await supabase.from('transactions').select('*').limit(1);
  if (transError) {
    console.error('Error fetching transactions:', transError);
  } else {
    console.log('Sample row from transactions:', transRow);
  }
}

inspectSchema();
