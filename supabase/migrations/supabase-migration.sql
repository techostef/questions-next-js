-- Create the quiz_cache table to store quiz data
CREATE TABLE quiz_cache (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL UNIQUE,
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the query column for faster lookups
CREATE INDEX idx_quiz_cache_query ON quiz_cache(query);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_quiz_cache_updated_at 
  BEFORE UPDATE ON quiz_cache 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE quiz_cache ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated users
-- You may want to adjust this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON quiz_cache
  FOR ALL USING (true);

-- Create a policy to allow read access for anonymous users (if needed)
CREATE POLICY "Allow read access for all users" ON quiz_cache
  FOR SELECT USING (true);
