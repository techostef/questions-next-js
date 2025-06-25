/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config'; // This will load environment variables from .env file
import { supabase } from '../lib/supabase';

// Data migration script to populate Supabase with existing quiz data
async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Fetch data from the original GitHub Gist
    const response = await fetch(
      "https://gist.githubusercontent.com/techostef/ad1d8a1f85b5e6f4fa5092b0b5b982d4/raw/english.json"
    );
    const data = await response.json();
    
    console.log('Fetched data from GitHub Gist');
    
    // Transform and insert data into Supabase
    const insertPromises = Object.entries(data).map(async ([query, responses]) => {
      const { data: insertedData, error } = await supabase
        .from('quiz_cache')
        .upsert({
          language: 'english',
          query: query,
          responses: responses as any[]
        }, {
          onConflict: 'query'
        });
      
      if (error) {
        console.error(`Error inserting data for query "${query}":`, error);
        throw error;
      }
      
      console.log(`Successfully migrated query: "${query}"`);
      return insertedData;
    });
    
    await Promise.all(insertPromises);
    
    console.log('Data migration completed successfully!');
    
    // Verify the data was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('quiz_cache')
      .select('query, created_at')
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('Error verifying data:', verifyError);
    } else {
      console.log(`Total entries in database: ${verifyData?.length || 0}`);
      verifyData?.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.query} (created: ${entry.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateData().then(() => {
    console.log('Migration script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export { migrateData };
