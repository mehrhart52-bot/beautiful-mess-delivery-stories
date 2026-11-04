const assert = require('node:assert/strict');
const {compatibleVersion:v,compatibleManifest:m,compatibleLock:l}=require('../.github/scripts/merge-dependency-fixes.cjs');
assert(v('16.4.3','16.4.4'));assert(v('16.4.3','16.5.0'));
for (const [a,b] of [['16.4.3','17.0.0'],['0.7.0','0.8.0'],['16.4.3','16.4.2'],['16.4.3','16.5.0-beta.1']]) assert(!v(a,b));
assert(m({dependencies:{next:'^16.4.3'}},{dependencies:{next:'^16.4.4'}}));
assert(!m({dependencies:{next:'^16.4.3'}},{dependencies:{next:'^17.0.0'}}));
assert(!m({scripts:{build:'next build'}},{scripts:{build:'untrusted'}}));
const lock=version=>({lockfileVersion:3,packages:{'':{},'node_modules/next':{version,resolved:'https://registry.npmjs.org/next/-/next.tgz',integrity:'sha512-fixture'}}});
assert(l(lock('16.4.3'),lock('16.4.4')));assert(!l(lock('16.4.3'),lock('17.0.0')));
const evil=lock('16.4.4');evil.packages['node_modules/next'].resolved='https://evil.example/next.tgz';assert(!l(lock('16.4.3'),evil));
const added=lock('16.4.4');added.packages['node_modules/unknown']={version:'1.0.0'};assert(!l(lock('16.4.3'),added));
console.log('Automatic merge policy tests passed.');

// Exercise the privileged workflow boundary without GitHub or real merges.
const {run}=require('../.github/scripts/merge-dependency-fixes.cjs');
async function scenario({author='dependabot[bot]',files=['package-lock.json'],codeql='success',behind=0,currentSha='head'}={}) {
 let merged=0;
 const pr={number:1,user:{login:author},head:{sha:'head',repo:{full_name:'owner/repo'}},base:{sha:'base'},state:'open'};
 const github={paginate:async(method)=>method(),rest:{
  pulls:{list:()=>[pr],listFiles:()=>files.map(filename=>({filename,status:'modified'})),get:async()=>({data:{...pr,head:{...pr.head,sha:currentSha}}}),merge:async(options)=>{assert.equal(options.sha,'head');merged++;return {data:{merged:true}};}},
  repos:{getContent:async({path,ref})=>({data:{encoding:'base64',content:Buffer.from(JSON.stringify(path==='package.json'?{dependencies:{next:'^16.4.3'}}:lock(ref==='base'?'16.4.3':'16.4.4'))).toString('base64')}}),compareCommits:async()=>({data:{behind_by:behind}})},
  actions:{listWorkflowRuns:async({workflow_id})=>({data:{workflow_runs:[{id:1,status:'completed',conclusion:workflow_id==='code-security.yml'?codeql:'success'}]}})}
 }};
 await run({github,context:{repo:{owner:'owner',repo:'repo'},payload:{workflow_run:{head_sha:'head'}}},core:{info:()=>{}}});
 return merged;
}
(async()=>{
 assert.equal(await scenario(),1);
 assert.equal(await scenario({author:'attacker'}),0);
 assert.equal(await scenario({files:['app/actions.ts']}),0);
 assert.equal(await scenario({codeql:'failure'}),0);
 assert.equal(await scenario({codeql:null}),0);
 assert.equal(await scenario({behind:1}),0);
 assert.equal(await scenario({currentSha:'changed-after-tests'}),0);
 console.log('Merge boundary tests passed: failed checks, untrusted authors/files, outdated branches and changed commits stay unmerged.');
})().catch(error=>{console.error(error);process.exitCode=1;});
