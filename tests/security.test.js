import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import Stripe from 'stripe';
import { userCache, readCache, activateUserCache, clearUserCache, purgeLegacyCache, invalidateContent, readStoredAuthSession } from '../src/lib/userCache.js';
import { prepareOffline, getOfflineSnapshot } from '../src/lib/offline.js';
import { requireResult } from '../src/lib/data.js';
import { validTimecodes } from '../src/lib/timecodes.js';
import { subscriptionPlan, PRICES } from '../server/billing.js';
import webhook, { processEvent } from '../api/webhook.js';

beforeEach(() => {
  const storage = {};
  Object.defineProperties(storage, {
    getItem: { value(key) { return this[key] ?? null; } },
    setItem: { value(key, value) { this[key] = String(value); } },
    removeItem: { value(key) { delete this[key]; } },
  });
  globalThis.localStorage = storage;
  globalThis.window = new EventTarget();
  activateUserCache('A');
});
test('cache isolates accounts, clears logout and rejects late writes', () => {
  userCache.setItem('A','canta_songs_offline','["private"]');
  assert.equal(userCache.getItem('B','canta_songs_offline'),null);
  clearUserCache('A'); activateUserCache('B');
  assert.equal(userCache.setItem('A','canta_songs_offline','["late"]'),false);
  assert.equal(userCache.getItem('A','canta_songs_offline'),null);
});
test('bulk delete invalidates individual songs and all related show copies', () => {
  for (const key of ['canta_song_single_1','canta_song_single_2','canta_play_offline_show','offline_snapshot']) userCache.setItem('A',key,'{}');
  invalidateContent('A',['1','2']);
  assert.equal(userCache.getItem('A','offline_snapshot'),'{}');
  assert.equal(userCache.getItem('A','canta_song_single_1'),null);
  assert.equal(userCache.getItem('A','canta_play_offline_show'),null);
});
test('stored Supabase session can be restored without network', () => {
  localStorage.setItem('sb-demo-auth-token', JSON.stringify({ access_token:'a', refresh_token:'r', user:{id:'A'} }));
  assert.equal(readStoredAuthSession().user.id, 'A');
});
test('legacy private keys are discarded, preferences and auth tokens preserved', () => {
  localStorage.setItem('canta_songs_offline','private');
  localStorage.setItem('canta_song_single_A_1','private');
  localStorage.setItem('sb-example-auth-token','session');
  localStorage.setItem('cantapro_fontSize','24');
  purgeLegacyCache();
  assert.deepEqual(Object.keys(localStorage).sort(),['cantapro_fontSize','sb-example-auth-token']);
});
test('corrupt JSON does not block authentication or content loading', () => {
  userCache.setItem('A','profile','{broken');
  assert.equal(readCache('A','profile'),null);
});
function offlineClient(failTable) {
  const fixtures={songs:[{id:'song',title:'Track'}],setlist_members:[],setlists:[{id:'show',owner_id:'A',event_name:'Show'}],
    setlist_items:[{id:'item',item_type:'song',songs:{id:'song',title:'Track'}}]};
  return { from(table) { return { select(){return this;},eq(){return this;},order(){return this;},
    async range(from,to) { return table===failTable ? {error:{message:'network failure'}} : {data:fixtures[table].slice(from,to+1),error:null}; } }; } };
}
test('offline preparation commits only complete snapshots and preserves one on failure', async () => {
  const original=await prepareOffline(offlineClient(),{id:'A'});
  assert.equal(original.shows.show.songs[0].id,'song');
  await assert.rejects(prepareOffline(offlineClient('setlist_items'),{id:'A'}),/network failure/);
  assert.deepEqual(getOfflineSnapshot('A'),original);
  await assert.rejects(prepareOffline(offlineClient(),{id:'A'},()=>false),/sessão/);
  assert.deepEqual(getOfflineSnapshot('A'),original);
});
test('failed song insert preserves draft and does not navigate', async () => {
  const source=fs.readFileSync(new URL('../src/pages/SongEdit.jsx',import.meta.url),'utf8');
  const body=source.split('const handleSave = async () => {')[1].split('  const handleDelete')[0].replace(/};\s*$/,'');
  let navigated=false,removed=false;
  const ctx=vm.createContext({isOnline:true,plan:'base',setSaving(){},durationMin:'0',durationSec:'0',title:'Test',artist:'',lyrics:'draft',user:{id:'A',email:'a@example.invalid'},isNew:true,
    supabase:{from:()=>({insert:()=>({select:()=>({single:async()=>({error:{message:'denied'}})})})})},
    requireResult,userCache:{removeItem(){removed=true;}},invalidateContent(){},alert(){},navigate(){navigated=true;}});
  await vm.runInContext('(async()=>{'+body+'})()',ctx);
  assert.equal(removed,false); assert.equal(navigated,false);
});
test('zero or overlapping timecodes fall back to linear playback', () => {
  assert.deepEqual(validTimecodes([{start_time:0,end_time:0}]),[]);
  assert.deepEqual(validTimecodes([{start_time:0,end_time:3},{start_time:2,end_time:4}]),[]);
  assert.equal(validTimecodes([{start_time:0,end_time:3}]).length,1);
});
const subscription=(status='active',price=PRICES.pro)=>({id:'sub',customer:'cus',status,metadata:{user_id:'A'},items:{data:[{price:{id:price},current_period_end:1900000000}]},latest_invoice:{status:'paid'}});
test('billing maps actual Price IDs, including discounted and trial subscriptions', () => {
  assert.equal(subscriptionPlan(subscription('active',PRICES.base)),'base');
  assert.equal(subscriptionPlan({...subscription(),amount_total:0}),'pro');
  assert.equal(subscriptionPlan({...subscription('trialing'),latest_invoice:null}),'pro');
  for (const state of ['canceled','unpaid','past_due','incomplete','paused']) assert.equal(subscriptionPlan(subscription(state)),'free');
  assert.equal(subscriptionPlan({...subscription(),latest_invoice:{status:'open'}}),'free');
  assert.throws(()=>subscriptionPlan(subscription('active','unknown')),/Unknown/);
});
function fakeDb(failure=false,linked={user_id:'A',stripe_subscription_id:'sub'}) {
  return { calls:[],from(){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:linked,error:null};}};},
    async rpc(name,args){this.calls.push({name,args});return {error:failure?{message:'DB failed'}:null};}};
}
test('webhook propagates persistence errors, restores active state and rejects mismatched accounts', async () => {
  const event={id:'evt',created:10,type:'customer.subscription.updated',data:{object:{id:'sub'}}};
  const stripe={subscriptions:{retrieve:async()=>subscription()}};
  await assert.rejects(processEvent(event,stripe,fakeDb(true)),/DB failed/);
  const db=fakeDb();await processEvent(event,stripe,db);assert.equal(db.calls[0].args.p_plan,'pro');
  await assert.rejects(processEvent(event,stripe,fakeDb(false,{user_id:'B'})),/mismatch/);
  const unpaid=fakeDb();await processEvent({...event,type:'checkout.session.completed',data:{object:{subscription:'sub',payment_status:'unpaid'}}},stripe,unpaid);
  assert.equal(unpaid.calls.length,0);
});
test('webhook verifies the real Stripe signature on raw Node streams', async () => {
  process.env.STRIPE_SECRET_KEY='sk_test_local_placeholder';
  process.env.SUPABASE_SERVICE_ROLE_KEY='local-placeholder';
  process.env.SUPABASE_URL='https://example.supabase.co';
  process.env.STRIPE_WEBHOOK_SECRET='whsec_local_placeholder';
  const payload=JSON.stringify({id:'evt_local',type:'unhandled.test',data:{object:{}}});
  const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
  const request=sig=>({method:'POST',headers:{'stripe-signature':sig},async *[Symbol.asyncIterator](){yield Buffer.from(payload);}});
  const response=()=>({code:200,status(code){this.code=code;return this;},json(body){this.body=body;return this;},end(){return this;}});
  const ok=response();await webhook(request(signature),ok);assert.equal(ok.code,200);
  const bad=response();await webhook(request('invalid'),bad);assert.equal(bad.code,400);
});
