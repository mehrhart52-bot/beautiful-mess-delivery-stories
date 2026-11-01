// Run from the repository root with PGLITE_MODULE pointing to PGlite.
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;`);
await db.exec(fs.readFileSync('supabase/schema.sql','utf8').replace('create extension if not exists pgcrypto;',''));
const user='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
for (const id of [user,other]) await db.query('insert into auth.users values ($1,$2,$3)',[id,`${id}@example.com`,JSON.stringify({display_name:'Test'})]);
async function signIn(id=user) {
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 await db.exec('set role authenticated');
}
async function seedTimes(sql) {
 await db.exec('reset role');
 await db.query(`update story_submission_limits set submitted_at = ${sql} where user_id=$1`,[user]);
 await signIn();
}
const submit=()=>db.query("insert into stories(user_id,body,experience) values ($1,'Test story','Other') returning id",[user]);
await signIn();
const first=(await submit()).rows[0].id;
await assert.rejects(submit(), /story_too_soon/);
await db.query("update stories set body='Edited story' where id=$1",[first]);
await db.query('delete from stories where id=$1',[first]);
await assert.rejects(submit(), /story_too_soon/);
await assert.rejects(db.query('delete from story_submission_limits'));
await assert.rejects(db.query('select * from story_submission_limits'));
await signIn(other);
await db.query("insert into stories(user_id,body) values ($1,'Independent account')",[other]);
await seedTimes("array[clock_timestamp() - interval '31 seconds']");
await submit();
await seedTimes("array(select clock_timestamp() - n * interval '1 minute' from generate_series(1,19) n)");
await submit(); // twentieth accepted
await assert.rejects(submit(), /story_daily_limit/);
await db.exec('reset role');
const before=(await db.query('select last_value from story_number_seq')).rows[0].last_value;
// Rerunning the migration must not erase counts for deleted stories.
await db.exec(fs.readFileSync('supabase/20261101_story_submission_limits.sql','utf8'));
await signIn(); await assert.rejects(submit(), /story_daily_limit/);
await db.exec('reset role');
assert.equal((await db.query('select last_value from story_number_seq')).rows[0].last_value,before);
await seedTimes("array[clock_timestamp() - interval '25 hours']");
const results=await Promise.allSettled([submit(),submit()]);
assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
assert.equal(results.filter(r=>r.status==='rejected' && /story_too_soon/.test(String(r.reason))).length,1);
console.log('Submission limits passed: cooldown, rolling cap, deletion bypass blocked, editing allowed, independent accounts, counter privacy, migration rerun, expiration and queued duplicate requests.');
await db.close();
