import { createClient } from '@supabase/supabase-js';

// Access Environment Variables using Vite's import.meta.env
const supabaseUrl = 'https://lvavtirslaqizvrwjgje.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YXZ0aXJzbGFxaXp2cndqZ2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODA5NjksImV4cCI6MjA5MDI1Njk2OX0.7hg6zK4VqD7Zf95HVmNyzM1ncADoqpk5PJHJXwWPY_g';

export const supabase = createClient(supabaseUrl, supabaseKey);
