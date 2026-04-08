-- =============================================
-- Neon Postgres Schema for QR Menu App
-- Run this in the Neon SQL Editor (Dashboard)
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table (food, drinks, rooms, etc.)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_am TEXT,
    name_om TEXT,
    description_en TEXT,
    description_am TEXT,
    description_om TEXT,
    type TEXT NOT NULL CHECK(type IN ('food', 'drink', 'room', 'spa', 'transport')),
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    ingredients TEXT,
    macro_kcal NUMERIC(10,2),
    macro_protein NUMERIC(10,2),
    macro_fat NUMERIC(10,2),
    macro_carbs NUMERIC(10,2),
    beds INTEGER DEFAULT 1,
    max_guests INTEGER DEFAULT 2,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    category TEXT,
    comment TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

-- Room orders table
CREATE TABLE IF NOT EXISTS room_orders (
    id SERIAL PRIMARY KEY,
    room_number TEXT NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES room_orders(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- Waiter calls table
CREATE TABLE IF NOT EXISTS waiter_calls (
    id SERIAL PRIMARY KEY,
    room_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add is_available column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'services' AND column_name = 'is_available'
    ) THEN
        ALTER TABLE services ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Seed a default admin user (password: admin123)
-- The hash below is bcrypt for 'admin123'
INSERT INTO users (email, username, password, role)
VALUES ('admin@admin.com', 'Administrator', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;
