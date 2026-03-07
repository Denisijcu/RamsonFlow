import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

// HTB VULN: hardcoded credentials discoverable via source enum or brute force
const USERS = [
  { email: 'admin@ransomflow.htb', password: 'admin123', role: 'admin' },
  { email: 'flowuser@ransomflow.htb', password: 'Fl0wUs3r!', role: 'user' },
  { email: 'demo@ransomflow.htb', password: 'demo', role: 'viewer' },
];

@Injectable()
export class AuthService {
  private readonly secret = process.env.JWT_SECRET || 'sup3rs3cr3t_htb_2026';

  async login(email: string, password: string): Promise<string | null> {
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) return null;

    // HTB VULN: JWT signed with weak secret, role embedded unverified
    return jwt.sign(
      { sub: email, role: user.role, platform: 'ransomflow' },
      this.secret,
      { expiresIn: '24h' },
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch {
      return null;
    }
  }
}
