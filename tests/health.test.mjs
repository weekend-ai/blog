import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, SignJWT} from 'jose';
import {validateRecord, OWNER_EMAIL} from '../shared/health.js';
import {verifyOwner, ownerOnly} from '../shared/health-auth.js';
import {onRequestPost} from '../functions/api/admin/health.js';

const valid={date:'2026-09-24',weight:92.25,bodyFat:18.5,muscle:71.3,muscleRate:77.3,revision:0};
test('record validation preserves report values and nullable fields',()=>{
  assert.equal(validateRecord(valid).muscleRate,77.3);
  assert.equal(validateRecord(valid).heart,null);
  for(const patch of [{date:'2026-02-30'},{weight:'92'},{muscle:100},{heart:12},{revision:-1},{bodyFat:NaN}]) assert.throws(()=>validateRecord({...valid,...patch}));
});
test('Access requires signed owner identity, audience, issuer and expiry',async()=>{
  const {privateKey,publicKey}=await generateKeyPair('RS256');
  const env={ACCESS_ISSUER:'https://example.cloudflareaccess.com',ACCESS_AUD:'health-admin'};
  const token=(email=OWNER_EMAIL,aud=env.ACCESS_AUD,exp='1h',issuer=env.ACCESS_ISSUER)=>new SignJWT({email}).setProtectedHeader({alg:'RS256'}).setIssuedAt().setSubject('owner').setIssuer(issuer).setAudience(aud).setExpirationTime(exp).sign(privateKey);
  assert.equal((await verifyOwner(await token(),env,publicKey)).email,OWNER_EMAIL);
  for(const args of [['other@example.com'],[OWNER_EMAIL,'wrong'],[OWNER_EMAIL,env.ACCESS_AUD,'-1h'],[OWNER_EMAIL,env.ACCESS_AUD,'1h','https://wrong.cloudflareaccess.com']]) await assert.rejects(verifyOwner(await token(...args),env,publicKey));
  await assert.rejects(verifyOwner('forged',env,publicKey));
  await assert.rejects(verifyOwner(await token(),{},publicKey));
});
test('unconfigured and unsigned requests fail closed',async()=>{
  const request=new Request('https://www.zinuo.me/api/admin/health');
  const next=()=>{throw new Error('Unauthorized request reached handler');};
  assert.equal((await ownerOnly({request,env:{},next})).status,503);
  assert.equal((await ownerOnly({request,env:{ACCESS_ISSUER:'https://example.cloudflareaccess.com',ACCESS_AUD:'a'},next})).status,401);
});
test('save rejects invalid input and stale revisions',async()=>{
  const request=data=>new Request('https://www.zinuo.me/api/admin/health',{method:'POST',body:JSON.stringify(data)});
  const db=changes=>({prepare:()=>({bind:()=>({run:async()=>({meta:{changes}})})})});
  assert.equal((await onRequestPost({request:request({...valid,weight:-1}),env:{HEALTH_DB:db(1)}})).status,400);
  assert.equal((await onRequestPost({request:request(valid),env:{HEALTH_DB:db(0)}})).status,409);
  const result=await onRequestPost({request:request(valid),env:{HEALTH_DB:db(1)}});
  assert.equal(result.status,200);
  assert.equal((await result.json()).revision,1);
});
