import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Add is_available column if missing
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'services' AND column_name = 'is_available'
        ) THEN
          ALTER TABLE services ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
        END IF;
      END $$`;

    return res.json({ success: true, message: 'Migration completed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
