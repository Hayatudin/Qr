import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
      const userId = req.query.user_id;
      if (!userId) return res.status(400).json({ error: 'Missing user_id' });
      const rows = await sql`
        SELECT f.id, f.service_id, s.name_en, s.name_am, s.name_om, s.description_en, s.description_am, s.description_om, s.type, s.price, s.image_url
        FROM favorites f JOIN services s ON f.service_id = s.id
        WHERE f.user_id = ${userId}`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { user_id, service_id } = req.body;
      try {
        const result = await sql`INSERT INTO favorites (user_id, service_id) VALUES (${user_id}, ${service_id}) RETURNING id`;
        return res.json({ success: true, id: result[0].id });
      } catch (e: any) {
        return res.status(409).json({ error: 'Already favorited' });
      }
    }

    if (req.method === 'DELETE') {
      const { user_id, service_id } = req.body;
      await sql`DELETE FROM favorites WHERE user_id = ${user_id} AND service_id = ${service_id}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
