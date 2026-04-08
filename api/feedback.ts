import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT f.id, f.comment, f.rating, f.created_at, f.category,
               u.username, s.name_en AS service_name
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN services s ON f.service_id = s.id
        ORDER BY f.created_at DESC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { user_id, service_id, category, comment, rating } = req.body;
      if (!category || !comment || !rating) {
        return res.status(400).json({ error: 'Missing required fields: category, comment, and rating.' });
      }
      const result = await sql`INSERT INTO feedback (user_id, service_id, category, comment, rating) VALUES (${user_id||null}, ${service_id||null}, ${category}, ${comment}, ${rating}) RETURNING id`;
      return res.json({ success: true, id: result[0].id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
