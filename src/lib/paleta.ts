/**
 * Paleta de cores Dommus / BNR (replicada do v001).
 */

export const COR_PRIMARIA = '#0F4C81';
export const COR_SECUNDARIA = '#F6A623';
export const COR_SUCESSO = '#2ECC71';
export const COR_ALERTA = '#E74C3C';
export const COR_NEUTRA = '#7F8C8D';
export const COR_FUNDO = '#FAFBFC';
export const COR_BORDA = '#E5E9F0';
export const COR_TEXTO_DIM = '#5A6677';

export const PALETA_GRAFICOS = [
  '#0F4C81',
  '#F6A623',
  '#2ECC71',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#34495E',
  '#E74C3C',
  '#3498DB',
  '#F1C40F',
];

export const CORES_STATUS_ESTOQUE: Record<string, string> = {
  DISPONIVEL: '#2ECC71',
  VENDIDA: '#0F4C81',
  RESERVA: '#F6A623',
  REGISTRADA: '#9B59B6',
  OUTROS: '#7F8C8D',
};

export const LABEL_STATUS_ESTOQUE: Record<string, string> = {
  DISPONIVEL: 'Disponivel',
  VENDIDA: 'Vendida',
  RESERVA: 'Reserva Tecnica',
  REGISTRADA: 'Registrada',
  OUTROS: 'Indisponivel para Venda',
};

export const ORDEM_STATUS_ESTOQUE = ['DISPONIVEL', 'VENDIDA', 'RESERVA', 'REGISTRADA', 'OUTROS'] as const;
