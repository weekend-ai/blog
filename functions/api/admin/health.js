import {PUBLIC_COLUMNS,json,validateRecord} from '../../../shared/health.js';
export async function onRequestGet({env,request}) {
  if (!env.HEALTH_DB) return json({error:'Database unavailable'},503);
  const date = new URL(request.url).searchParams.get('date');
  if (date) return json(await env.HEALTH_DB.prepare(`SELECT ${PUBLIC_COLUMNS}, revision FROM health_records WHERE date=?`).bind(date).first());
  const {results} = await env.HEALTH_DB.prepare(`SELECT ${PUBLIC_COLUMNS}, revision, updated_at FROM health_records ORDER BY date`).all();
  return json(results);
}
export async function onRequestPost({env,request}) {
  if (!env.HEALTH_DB) return json({error:'Database unavailable'},503);
  const raw = await request.text();
  if (raw.length > 4096) return json({error:'Record too large'},413);
  let record;
  try { record=validateRecord(JSON.parse(raw)); } catch(e) { return json({error:e.message},400); }
  const {date,weight,bodyFat,muscle,muscleRate,fatMass,visceral,heart,revision}=record;
  try {
    const result = revision === 0
      ? await env.HEALTH_DB.prepare('INSERT INTO health_records (date,weight,bodyFat,muscle,muscleRate,fatMass,visceral,heart) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(date) DO NOTHING').bind(date,weight,bodyFat,muscle,muscleRate,fatMass,visceral,heart).run()
      : await env.HEALTH_DB.prepare("UPDATE health_records SET weight=?,bodyFat=?,muscle=?,muscleRate=?,fatMass=?,visceral=?,heart=?,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE date=? AND revision=?").bind(weight,bodyFat,muscle,muscleRate,fatMass,visceral,heart,date,revision).run();
    if (!result.meta.changes) return json({error:'This date has changed. Reload it before saving.'},409);
    return json({ok:true,date,revision:revision+1});
  } catch { return json({error:'Save failed. Your input has not been cleared.'},500); }
}
