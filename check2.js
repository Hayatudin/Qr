import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
const sql = neon(process.env.DATABASE_URL);
sql(`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'services'`)
  .then(console.log)
  .catch(console.error);
