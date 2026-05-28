import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, signSession, COOKIE_CONFIG, AuthUser } from '@/lib/auth';

interface UserRow {
  id_usuario_gu: number;
  email: string;
  password: string;
  perfil_usuario: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();
    if (!email || !senha) {
      return NextResponse.json({ error: 'E-mail e senha sao obrigatorios.' }, { status: 400 });
    }

    // Schema legado: a tabela tem id_usuario / emails_usario / perfil_usuario
    // (sem coluna nome). Aliasamos para o formato que o app espera.
    const row = await queryOne<UserRow>(
      `SELECT
         id_usuario      AS id_usuario_gu,
         emails_usario   AS email,
         password        AS password,
         perfil_usuario  AS perfil_usuario
       FROM d_usuario_gu
       WHERE emails_usario = ?
       LIMIT 1`,
      [String(email).trim()]
    );

    if (!row || !verifyPassword(String(senha), row.password ?? '')) {
      return NextResponse.json({ error: 'E-mail ou senha invalidos.' }, { status: 401 });
    }

    // Sem coluna `nome` na tabela: usa perfil_usuario, ou deriva do email.
    const nome =
      (row.perfil_usuario ?? '').trim() ||
      String(row.email ?? '').split('@')[0] ||
      String(row.email ?? '');

    const user: AuthUser = {
      id_usuario_gu: row.id_usuario_gu,
      nome,
      email: row.email ?? '',
    };

    const token = await signSession(user);
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set({ ...COOKIE_CONFIG, value: token });
    return res;
  } catch (err) {
    console.error('[login] erro:', err);
    return NextResponse.json({ error: 'Erro ao processar login.' }, { status: 500 });
  }
}
