import {createRemoteJWKSet, jwtVerify} from 'jose';
import {OWNER_EMAIL, json} from './health.js';
const keySets = new Map();
export async function verifyOwner(token, env, keys) {
  const issuer = env.ACCESS_ISSUER?.replace(/\/$/, '');
  if (!issuer || !env.ACCESS_AUD || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)) throw new Error('Access not configured');
  if (!keys) {
    if (!keySets.has(issuer)) keySets.set(issuer, createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
    keys = keySets.get(issuer);
  }
  const {payload} = await jwtVerify(token, keys, {issuer, audience: env.ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp','iat','sub','email']});
  if (payload.email !== OWNER_EMAIL) throw new Error('Owner only');
  return payload;
}
export async function ownerOnly(context) {
  const {request,env} = context;
  if (!env.ACCESS_ISSUER || !env.ACCESS_AUD) return json({error:'Login is not configured yet'},503);
  try { await verifyOwner(request.headers.get('Cf-Access-Jwt-Assertion') || '',env); }
  catch { return json({error:'Please sign in with the authorized account'},401); }
  if (!['GET','HEAD'].includes(request.method)) {
    if (request.headers.get('Origin') !== new URL(request.url).origin || !request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Invalid request origin or content type'},403);
  }
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control','no-store');
  headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,headers});
}
