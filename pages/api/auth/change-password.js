import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { query } from '../../../lib/db';
import { verifyPassword, hashPassword } from '../../../lib/auth';

export default async function changePasswordHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getIronSession(req, res, sessionOptions);
  
  try {
    const { currentPassword, newPassword } = req.body;
    const user = session.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get the user from the database
    const result = await query('SELECT * FROM users WHERE id = $1', [user.id]);
    const existingUser = result.rows[0];
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, existingUser.password_hash);
    
    if (!isValid) {
      return res.status(403).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
