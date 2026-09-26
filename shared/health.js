export const OWNER_EMAIL = 'zinuo.lee@gmail.com';
export const PUBLIC_COLUMNS = 'date, weight, bodyFat, muscle, muscleRate, fatMass, visceral, heart';
export function json(data, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
}
export function validateRecord(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid record');
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Invalid date');
  const date = new Date(input.date + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input.date) throw new Error('Invalid date');
  const record = {date: input.date};
  for (const [field,min,max,required,integer] of [
    ['weight',1,500,true,false], ['bodyFat',0,100,true,false], ['muscle',0.1,500,true,false],
    ['muscleRate',0,100,false,false], ['fatMass',0,500,false,false],
    ['visceral',1,60,false,true], ['heart',20,250,false,true]
  ]) {
    const v = input[field];
    if (v === null || v === undefined || v === '') {
      if (required) throw new Error('Missing '+field);
      record[field] = null; continue;
    }
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) throw new Error('Invalid '+field);
    record[field] = v;
  }
  if (record.muscle > record.weight || record.fatMass > record.weight) throw new Error('Mass cannot exceed weight');
  if (!Number.isInteger(input.revision) || input.revision < 0) throw new Error('Invalid revision');
  return {...record, revision: input.revision};
}
