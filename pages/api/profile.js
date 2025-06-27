import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../lib/session';
import { query } from '../../lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import process from 'process';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

// Remove S3 logic and use local file saving
async function saveFileToLocal(file) {
  // Handle both array and object
  const fileObj = Array.isArray(file) ? file[0] : file;
  const fileExt = path.extname(fileObj.originalFilename || fileObj.name || '');
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
  const mediaDir = path.join(process.cwd(), 'public', 'media');
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  const destPath = path.join(mediaDir, fileName);
  fs.copyFileSync(fileObj.filepath, destPath);
  // Return the public URL path
  return `/media/${fileName}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Debug: print the database connection string
  console.log('DEBUG POSTGRES_URL:', process.env.POSTGRES_URL);

  const session = await getIronSession(req, res, sessionOptions);
  const userId = session.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    // Debug: print columns seen by the API server
    const debugResult = await query("SELECT * FROM users LIMIT 1");
    console.log('DEBUG users row:', debugResult.rows[0]);
    const form = new IncomingForm();
    // Await form.parse using a Promise
    await new Promise((resolve) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          res.status(500).json({ message: 'Error processing form data' });
          return resolve();
        }

        try {
          const { bio, instagram_url } = fields;
          let avatarUrl = null;

          // Handle file upload if present
          if (files.avatar) {
            avatarUrl = await saveFileToLocal(files.avatar);
          }

          // Update user in database
          const updateFields = [];
          const updateValues = [];
          let paramCount = 1;

          if (avatarUrl) {
            updateFields.push(`avatar_url = $${paramCount++}`);
            updateValues.push(avatarUrl);
          }

          // Ensure bio is a plain string
          let bioString = bio;
          if (typeof bioString !== 'string') {
            try {
              bioString = JSON.parse(bioString);
            } catch {
              // fallback: if parsing fails, use as is
            }
          }
          if (typeof bioString !== 'string') {
            bioString = String(bioString);
          }
          if (bioString) {
            updateFields.push(`bio = $${paramCount++}`);
            updateValues.push(bioString);
          }

          // Ensure instagram_url is a plain string
          let igString = instagram_url;
          if (typeof igString !== 'string') {
            try {
              igString = JSON.parse(igString);
            } catch {
              // fallback: if parsing fails, use as is
            }
          }
          if (typeof igString !== 'string') {
            igString = String(igString);
          }
          if (igString) {
            updateFields.push(`instagram_url = $${paramCount++}`);
            updateValues.push(igString);
          }

          // Always update the updated_at timestamp
          updateFields.push(`updated_at = NOW()`);

          if (updateFields.length > 0) {
            const queryText = `
              UPDATE users 
              SET ${updateFields.join(', ')}
              WHERE id = $${paramCount}
              RETURNING id, username, role, avatar_url, bio, instagram_url, created_at, updated_at
            `;
            
            const result = await query(queryText, [...updateValues, userId]);
            const updatedUser = result.rows[0];
            
            // Update the session with the latest user data
            session.user = {
              ...session.user,
              avatar_url: updatedUser.avatar_url,
              bio: updatedUser.bio,
              instagram_url: updatedUser.instagram_url,
            };
            await session.save();
            
            res.status(200).json({ 
              message: 'Profile updated successfully',
              user: updatedUser 
            });
            return resolve();
          }

          res.status(200).json({ message: 'No changes detected' });
          return resolve();
        } catch (error) {
          console.error('Profile update error:', error);
          res.status(500).json({ message: error.message || 'Failed to update profile' });
          return resolve();
        }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
