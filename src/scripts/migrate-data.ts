/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config'; // This will load environment variables from .env file
import { supabase } from '../lib/supabase';


// Migrate quiz listening data from GitHub Gist to Supabase
async function migrateListeningData() {
  try {
    console.log('Starting quiz listening data migration...');
    
    // Fetch data from the quiz listening GitHub Gist
    const response = await fetch(
      "https://gist.githubusercontent.com/techostef/bc9350af3cd7821a465e5b4ece52da02/raw/listening.json"
    );
    const data = await response.json();
    
    console.log('Fetched quiz listening data from GitHub Gist');
    console.log(`Found ${Object.keys(data).length} quiz listening topics`);
    
    // Transform and insert data into Supabase
    const insertPromises = Object.entries(data).map(async ([query, responses]) => {
      // First check if this query already exists
      const { data: existingData, error: fetchError } = await supabase
        .from('quiz_listening')
        .select('id')
        .eq('query', query)
        .limit(1);
      
      if (fetchError) {
        console.error(`Error checking for existing query "${query}":`, fetchError);
        throw fetchError;
      }
      
      let error;
      let insertedData;
      
      // If the record exists, update it
      if (existingData && existingData.length > 0) {
        console.log(`Query "${query}" already exists. Updating...`);
        const { data: updatedData, error: updateError } = await supabase
          .from('quiz_listening')
          .update({
            responses: responses as any[],
            updated_at: new Date().toISOString()
          })
          .eq('query', query);
        
        error = updateError;
        insertedData = updatedData;
      } else {
        // Otherwise insert a new record
        console.log(`Inserting new query: "${query}"`);
        const { data: newData, error: insertError } = await supabase
          .from('quiz_listening')
          .insert({
            query: query,
            responses: responses as any[],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        error = insertError;
        insertedData = newData;
      }
      
      if (error) {
        console.error(`Error handling data for query "${query}":`, error);
        throw error;
      }
      
      console.log(`Successfully migrated listening query: "${query}"`);
      return insertedData;
    });
    
    await Promise.all(insertPromises);
    
    console.log('Quiz listening data migration completed successfully!');
    
    // Verify the data was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('quiz_listening')
      .select('query, created_at')
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('Error verifying quiz listening data:', verifyError);
    } else {
      console.log(`Total quiz listening entries in database: ${verifyData?.length || 0}`);
      verifyData?.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.query} (created: ${entry.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('Quiz listening migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  // Run both migrations in sequence
  Promise.resolve()
    .then(() => migrateListeningData())
    .then(() => {
      console.log('All migration scripts completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration scripts failed:', error);
      process.exit(1);
    });
}

export { migrateListeningData };
