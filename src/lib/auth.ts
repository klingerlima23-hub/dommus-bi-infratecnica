import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface AuthUser {
  id_usuario_gu: number;
  nome: string;
  email: string;
}

const COOKIE_NAME = 'dommus_session';
const ALGO = 'HS256';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET nao configurado');
  return new TextEncoder().encode(secret);
}

/**
 * Verifica senha contra hash armazenado.
 * Suporta bcrypt ($2*), SHA-512 (128 hex), SHA-256 (64 hex), SHA-1 (40 hex), MD5 (32 hex).
 * Mesma lógica do _verify_password() do v001.
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!plain || !stored) return false;
  const s = stored.trim();

  // bcrypt
  if (s.startsWith('$2')) {
    try {
      return bcrypt.compareSync(plain, s);
    } catch {
      return false;
    }
  }

  // hashes hex de tamanhos conhecidos
  const isHex = (str: string) => /^[0-9a-fA-F]+$/.test(str);
  const lower = s.toLowerCase();

  if (s.length === 128 && isHex(s)) {
    return crypto.createHash('sha512').update(plain, 'utf8').digest('hex') === lower;
  }
  if (s.length === 64 && isHex(s)) {
    return crypto.createHash('sha256').update(plain, 'utf8').digest('hex') === lower;
  }
  if (s.length === 40 && isHex(s)) {
    return crypto.createHash('sha1').update(plain, 'utf8').digest('hex') === lower;
  }
  if (s.length === 32 && isHex(s)) {
    return crypto.createHash('md5').update(plain, 'utf8').digest('hex') === lower;
  }

  // fallback: texto plano (apenas para legado, não recomendado)
  return s === plain;
}

/**
 * Assina um JWT contendo o user payload.
 */
export async function signSession(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: ALGO })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret());
}

/**
 * Verifica e decodifica o JWT. Retorna null se inválido/expirado.
 */
export async function verifySession(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGO] });
    return {
      id_usuario_gu: Number(payload.id_usuario_gu),
      nome: String(payload.nome ?? ''),
      email: String(payload.email ?? ''),
    };
  } catch {
    return null;
  }
}

/**
 * Lê o user atual a partir do cookie de sessão (server-side only).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const COOKIE_CONFIG = {
  name: COOKIE_NAME,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12, // 12h
};
