# Supabase Migration Guide

This guide explains how to migrate from GitHub Gist to Supabase for quiz data storage.

## Setup Steps

### 1. Database Setup
Run the SQL migration script in your Supabase dashboard:

```sql
-- Execute the contents of supabase-migration.sql in your Supabase SQL editor
```

The script will create:
- `quiz_cache` table with proper structure
- Indexes for better performance
- Row Level Security policies
- Auto-updating timestamps

### 2. Data Migration
Run the data migration script to transfer existing data from GitHub Gist to Supabase:

```bash
# Compile and run the migration script
npx tsx src/scripts/migrate-data.ts
```

This will:
- Fetch data from the existing GitHub Gist
- Transform it to the new Supabase format
- Insert all quiz data into the database
- Verify the migration was successful

### 3. Environment Variables
Ensure your `.env` file contains the Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Endpoints

### Original Endpoints
- `GET /api/cache-quiz` - Retrieve all cached quiz data (now from Supabase)
- `POST /api/cache-quiz` - Get specific cached quiz data by query

### New Admin Endpoints
- `GET /api/quiz-admin` - List all quiz queries
- `GET /api/quiz-admin?query=<query>` - Get specific quiz data
- `POST /api/quiz-admin` - Add or update quiz data
- `DELETE /api/quiz-admin?query=<query>` - Delete quiz data

## Usage Examples

### Adding New Quiz Data
```typescript
const response = await fetch('/api/quiz-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'i want to practice tenses',
    responses: [
      {
        role: 'assistant',
        content: '{"questions": [...]}',
        refusal: null,
        annotations: []
      }
    ]
  })
});
```

### Getting All Quiz Queries
```typescript
const response = await fetch('/api/quiz-admin');
const queries = await response.json();
```

### Getting Specific Quiz Data
```typescript
const response = await fetch('/api/quiz-admin?query=i wanna practice preposition grammar');
const quizData = await response.json();
```

## Database Schema

### quiz_cache table
```sql
id SERIAL PRIMARY KEY
query TEXT NOT NULL UNIQUE
responses JSONB NOT NULL
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Response Structure
```typescript
interface QuizResponse {
  role: 'assistant'
  content: string  // JSON string containing quiz questions
  refusal: null
  annotations: any[]
}
```

## Benefits of Migration

1. **Better Performance**: Database queries are faster than HTTP requests
2. **Real-time Updates**: Data can be updated without modifying GitHub Gists
3. **Scalability**: Supabase can handle more concurrent requests
4. **Data Management**: Easy CRUD operations through admin API
5. **Analytics**: Track usage patterns and quiz performance
6. **Backup**: Automatic backups through Supabase
7. **Security**: Row Level Security and proper access controls

## Rollback Plan

If you need to rollback to GitHub Gist:
1. Revert the changes in `src/app/api/cache-quiz/route.ts`
2. Restore the original `URL_CACHE` constant
3. Remove Supabase imports

The original data remains in the GitHub Gist and can be used immediately.
