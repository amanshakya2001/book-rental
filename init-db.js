const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const saltRounds = 10;

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connected to the database.');

    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS books;');
    await client.query('DROP TABLE IF EXISTS users;');

    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created successfully.');

    console.log('Creating books table...');
    await client.query(`
      CREATE TABLE books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        price_per_day NUMERIC(10, 2) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        renter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Books table created successfully.');

    console.log('Seeding users...');
    const adminPasswordHash = await bcrypt.hash('adminpassword', saltRounds);
    const user1PasswordHash = await bcrypt.hash('password123', saltRounds);

    await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3), ($4, $5, $6);`,
      ['admin', adminPasswordHash, 'admin', 'user1', user1PasswordHash, 'user']
    );
    console.log('Users seeded successfully.');

    const users = await client.query('SELECT id, username FROM users;');
    const adminId = users.rows.find(u => u.username === 'admin').id;
    const user1Id = users.rows.find(u => u.username === 'user1').id;

    console.log('Seeding books...');
    await client.query(
      `INSERT INTO books (title, author, price_per_day, owner_id) VALUES
        ('The Great Gatsby', 'F. Scott Fitzgerald', 1.50, $1),
        ('To Kill a Mockingbird', 'Harper Lee', 1.25, $1),
        ('1984', 'George Orwell', 1.00, $2),
        ('Pride and Prejudice', 'Jane Austen', 1.75, $2);`,
      [adminId, user1Id]
    );
    console.log('Books seeded successfully.');

    console.log('\nDatabase setup complete!');
  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    await client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
}

setupDatabase();
