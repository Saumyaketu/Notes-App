import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { signToken, verifyToken } from '../utils/token.js';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID } from '../config/env.js';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function register(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await hashPassword(password);
    const user = new User({ email: email.toLowerCase(), passwordHash, name });
    await user.save();

    const token = signToken({ userId: user._id });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: user._id });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function me(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return res.status(401).json({ error: 'Invalid token' });

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user: user.toPublic() });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is missing' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // User does not exist, create a new one.
      // Use a placeholder password since Google handles authentication.
      const passwordHash = await hashPassword(Math.random().toString());
      user = new User({ email: email.toLowerCase(), passwordHash, name });
      await user.save();
    }

    const token = signToken({ userId: user._id });
    return res.json({ token });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(401).json({ error: 'Invalid Google token' });
  }
}