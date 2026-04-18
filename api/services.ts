import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
        const isAdmin = req.query.admin === '1';
        let rows;
        if (isAdmin) {
          rows = await sql`SELECT id, name_en, name_am, name_om, description_en, description_am, description_om, type, subcategory, price, image_url, ingredients, macro_kcal, macro_protein, macro_fat, macro_carbs, beds, max_guests, room_number, is_available, created_at FROM services ORDER BY created_at DESC`;
        } else {
          rows = await sql`SELECT id, name_en, name_am, name_om, description_en, description_am, description_om, type, subcategory, price, image_url, ingredients, macro_kcal, macro_protein, macro_fat, macro_carbs, beds, max_guests, room_number, created_at FROM services WHERE is_available = TRUE ORDER BY created_at DESC`;
        }
        return res.json(rows);
      }

      case 'PATCH': {
        const { id, is_available, name_am, name_om, description_am, description_om, subcategory } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing ID' });

        if (is_available !== undefined) {
          await sql`UPDATE services SET is_available = ${is_available} WHERE id = ${id}`;
        }
        if (subcategory !== undefined) {
          await sql`UPDATE services SET subcategory = ${subcategory || null} WHERE id = ${id}`;
        }
        if (name_am !== undefined) {
          await sql`UPDATE services SET name_am = ${name_am} WHERE id = ${id}`;
        }
        if (name_om !== undefined) {
          await sql`UPDATE services SET name_om = ${name_om} WHERE id = ${id}`;
        }
        if (description_am !== undefined) {
          await sql`UPDATE services SET description_am = ${description_am} WHERE id = ${id}`;
        }
        if (description_om !== undefined) {
          await sql`UPDATE services SET description_om = ${description_om} WHERE id = ${id}`;
        }
        return res.json({ success: true });
      }

      case 'POST': {
        const { id: updateId, name_en, description_en, name_am, description_am, name_om, description_om, type, subcategory, price, image_url, ingredients, macro_kcal, macro_protein, macro_fat, macro_carbs, beds, max_guests, room_number } = req.body;

        if (updateId) {
          // Update
          await sql`UPDATE services SET name_en=${name_en}, description_en=${description_en}, name_am=${name_am||null}, description_am=${description_am||null}, name_om=${name_om||null}, description_om=${description_om||null}, type=${type}, subcategory=${subcategory||null}, price=${price}, image_url=${image_url||null}, ingredients=${ingredients||null}, macro_kcal=${macro_kcal||null}, macro_protein=${macro_protein||null}, macro_fat=${macro_fat||null}, macro_carbs=${macro_carbs||null}, beds=${beds||null}, max_guests=${max_guests||null}, room_number=${room_number||null} WHERE id=${updateId}`;
          return res.json({ success: true });
        } else {
          // Create
          const result = await sql`INSERT INTO services (name_en, description_en, name_am, description_am, name_om, description_om, type, subcategory, price, image_url, ingredients, macro_kcal, macro_protein, macro_fat, macro_carbs, beds, max_guests, room_number) VALUES (${name_en}, ${description_en}, ${name_am||null}, ${description_am||null}, ${name_om||null}, ${description_om||null}, ${type}, ${subcategory||null}, ${price}, ${image_url||null}, ${ingredients||null}, ${macro_kcal||null}, ${macro_protein||null}, ${macro_fat||null}, ${macro_carbs||null}, ${beds||null}, ${max_guests||null}, ${room_number||null}) RETURNING *`;
          return res.json({ success: true, service: result[0] });
        }
      }

      case 'DELETE': {
        const { id: deleteId } = req.body;
        if (!deleteId) return res.status(400).json({ error: 'Missing service ID' });
        // Delete related order items first to prevent foreign key violations
        await sql`DELETE FROM order_items WHERE service_id = ${deleteId}`;
        await sql`DELETE FROM services WHERE id = ${deleteId}`;
        return res.json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
