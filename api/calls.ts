import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function setCors(res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sql = neon(process.env.DATABASE_URL!);

  try {
    switch (req.method) {
      case 'GET': {
        const rows = await sql`SELECT * FROM waiter_calls ORDER BY created_at DESC`;
        return res.json(rows);
      }

      case 'POST': {
        const { roomNumber } = req.body;
        if (!roomNumber) return res.status(400).json({ error: 'Room number is required.' });
        const result = await sql`INSERT INTO waiter_calls (room_number) VALUES (${roomNumber}) RETURNING id`;
        return res.json({ success: true, call_id: result[0].id });
      }

      case 'PATCH': {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ error: 'Missing call ID or status.' });
        await sql`UPDATE waiter_calls SET status = ${status} WHERE id = ${id}`;
        return res.json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
