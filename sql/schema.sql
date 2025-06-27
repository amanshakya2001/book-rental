-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    price_per_day NUMERIC(10, 2) NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT TRUE,
    renter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rented_until DATE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
-- Insert a default admin and user for testing
-- Passwords are 'adminpassword' and 'userpassword' (will be hashed by the app)
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$D/2MvA05d1eC.E.a.Q.d.O6zY2C/I1.H.a/E.z.e.f.g.h.i', 'admin'),
('user1', '$2b$10$D/2MvA05d1eC.E.a.Q.d.O6zY2C/I1.H.a/E.z.e.f.g.h.i', 'user');

-- Insert sample books owned by the new users
INSERT INTO books (title, author, price_per_day, owner_id, is_available, renter_id, rented_until) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 1.50, 2, TRUE, NULL, NULL),
('1984', 'George Orwell', 1.25, 1, FALSE, 2, '2024-08-15');
