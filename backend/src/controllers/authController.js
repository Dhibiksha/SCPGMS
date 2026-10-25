import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log for login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        detailsJson: JSON.stringify({ email: user.email, role: user.role })
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential (ID token) is required' });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    // Check if development mock is enabled for automated test suite
    let payload = null;
    const isDevMock = process.env.NODE_ENV === 'development' && credential.startsWith('dev-mock-google-token:');

    if (isDevMock) {
      try {
        const jsonPart = Buffer.from(credential.replace('dev-mock-google-token:', ''), 'base64').toString('utf-8');
        payload = JSON.parse(jsonPart);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid development test Google token format' });
      }
    } else {
      if (!googleClientId) {
        return res.status(503).json({
          error: 'Google authentication is awaiting configuration on this server. Please set GOOGLE_CLIENT_ID in your backend .env file.'
        });
      }

      try {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error('Google token verification failed:', verifyErr.message);
        return res.status(401).json({ error: 'Invalid or expired Google credential token' });
      }
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Google credential does not contain a valid email' });
    }

    // Security check: email must be verified by Google to prevent unverified account takeover
    if (payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google email address is not verified. Please verify your email with Google first.' });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    // Query database for existing corporate account matching the verified Google email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: `No corporate account found matching Google email (${normalizedEmail}). Please contact an administrator to provision your corporate access.`
      });
    }

    // Issue existing application JWT with user's genuine database role and employeeId
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log entry for Google authentication
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'GOOGLE_LOGIN',
        entityType: 'User',
        entityId: user.id,
        detailsJson: JSON.stringify({
          email: user.email,
          role: user.role,
          googleSub: payload.sub,
          authProvider: 'google'
        })
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee
      }
    });
  } catch (error) {
    console.error('Google login internal error:', error);
    return res.status(500).json({ error: 'Internal server error during Google authentication' });
  }
}

export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        employee: {
          include: {
            department: true,
            skills: {
              include: { skill: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching current user' });
  }
}

export async function logout(req, res) {
  return res.json({ message: 'Logged out successfully' });
}
