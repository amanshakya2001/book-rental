// lib/session.js
export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'rent-your-book-session',
  // secure: true should be used in production (HTTPS) but can be false in development (HTTP).
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
