/**
 * URLs de sistemas externos (CRM, Leads) usadas pelos links das tabelas.
 *
 * Centralizado aqui pra ficar facil trocar o subdominio quando esse
 * dashboard for clonado pra outro cliente -- basta editar uma constante.
 */

const CRM_BASE = 'https://infratecnica.dommus2.com.br/2.0/index_ui.php?mgr=MQ==&ui=NjM=';
const LEADS_BASE = 'https://leads.dommus.com.br/oportunidade';

/** Link pra abrir um processo no CRM Infratecnica. */
export function urlProcesso(id: number | string | null | undefined): string | null {
  if (id === null || id === undefined || id === '') return null;
  return `${CRM_BASE}&id_processo=${id}`;
}

/** Link pra abrir uma oportunidade no sistema de leads. */
export function urlOportunidade(id: number | string | null | undefined): string | null {
  if (id === null || id === undefined || id === '') return null;
  return `${LEADS_BASE}/${id}`;
}
