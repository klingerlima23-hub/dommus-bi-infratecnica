'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, MessageCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(j.error ?? 'E-mail ou senha invalidos.');
        setLoading(false);
        return;
      }
      // Usa window.location em vez de router.push: garante que o RSC cache
      // do App Router seja invalidado e o cookie de sessao recem-setado seja
      // lido pelo middleware/server components. Sem isso, ocasionalmente a
      // navegacao client-side mantem o estado pre-login e a tela fica travada
      // ("Entrando...") ate um F5 manual.
      window.location.href = '/dashboard/vendas';
    } catch {
      setErro('Erro ao conectar. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center px-4">
      {/* Logo Dommus + título */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="https://www.dommus.com.br/wp-content/uploads/2024/08/image_3.webp"
          alt="Dommus"
          className="h-16 mb-2"
        />
        <h2
          className="text-[0.78rem] font-medium uppercase tracking-[1px]"
          style={{ color: '#5A6677' }}
        >
          Dommus Inteligência
        </h2>
      </div>

      {/* Card de login */}
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[420px] bg-white border border-[#E5E9F0] rounded-md p-8"
      >
        <div className="mb-4">
          <label className="block text-[0.72rem] font-bold uppercase tracking-wider text-[#5A6677] mb-1.5">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@empresa.com"
            required
            autoComplete="username"
            className="w-full px-3.5 py-2.5 bg-[#F4F6FA] border border-transparent rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
          />
        </div>

        <div className="mb-2">
          <label className="block text-[0.72rem] font-bold uppercase tracking-wider text-[#5A6677] mb-1.5">
            Senha
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 pr-10 bg-[#F4F6FA] border border-transparent rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#5A6677] hover:text-[#0F4C81] transition"
              aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <a
            href="https://wa.me/5531999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#5A6677] hover:text-[#0F4C81] transition"
          >
            <KeyRound size={14} /> Esqueceu a Senha?
          </a>
        </div>

        {erro && (
          <div className="mb-4 text-xs text-[#E74C3C] bg-[#fdecea] border border-[#f5c6cb] rounded-md px-3 py-2">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1B3A6B] hover:bg-[#142b50] text-white font-bold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-[0.78rem] text-[#5A6677]">
        © Copyright Dommus Tecnologia. Todos os Direitos Reservados.
      </p>

      {/* FAB WhatsApp */}
      <a
        href={process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/5531999999999'}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        title="Suporte via WhatsApp"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
