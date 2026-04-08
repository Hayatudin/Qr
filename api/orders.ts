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
        const rows = await sql`
          SELECT o.*, 
            COALESCE(
              (SELECT json_agg(json_build_object('id', oi.id, 'service_id', oi.service_id, 'quantity', oi.quantity, 'price', oi.price, 'name_en', s.name_en, 'image_url', s.image_url))
               FROM order_items oi JOIN services s ON oi.service_id = s.id WHERE oi.order_id = o.id), '[]'
            ) as items
          FROM room_orders o ORDER BY o.created_at DESC`;
        return res.json(rows);
      }

      case 'POST': {
        const { roomNumber, items } = req.body;
        if (!roomNumber || !items || items.length === 0) {
          return res.status(400).json({ error: 'Room number and items are required.' });
        }

        let total_price = 0;
        for (const item of items) {
          total_price += item.price * item.quantity;
        }

        const orderResult = await sql`INSERT INTO room_orders (room_number, total_price) VALUES (${roomNumber}, ${total_price}) RETURNING id`;
        const orderId = orderResult[0].id;

        for (const item of items) {
          await sql`INSERT INTO order_items (order_id, service_id, quantity, price) VALUES (${orderId}, ${item.id}, ${item.quantity}, ${item.price})`;
        }

        return res.json({ success: true, order_id: orderId });
      }

      case 'PATCH': {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ error: 'Missing order ID or status.' });
        await sql`UPDATE room_orders SET status = ${status} WHERE id = ${id}`;
        return res.json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
