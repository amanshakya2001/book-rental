import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';

export default async function userHandler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
}
