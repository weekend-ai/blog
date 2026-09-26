import {PUBLIC_COLUMNS,json} from '../../shared/health.js';
export async function onRequestGet({env}) {
  if (!env.HEALTH_DB) return json({error:'Health database is unavailable'},503);
  try {
    const {results} = await env.HEALTH_DB.prepare(`SELECT ${PUBLIC_COLUMNS} FROM health_records ORDER BY date`).all();
    return json(results);
  } catch { return json({error:'Unable to load records'},503); }
}
