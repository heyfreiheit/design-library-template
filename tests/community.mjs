import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadModule} from './load-module.mjs';
const seed=JSON.parse(readFileSync('data/gallery.json','utf8'));
assert.equal(seed.entries.length,34);assert.equal(new Set(seed.entries.map(e=>e.sourceUrl)).size,34);
const {referenceFields,analysisSchema}=loadModule('lib/reference-model.ts');
for(const e of seed.entries){referenceFields.parse(e);assert(seed.collections.some(c=>c.id===e.collection));assert(e.id.startsWith('community-'));assert.equal(e.file,'capture-pending.svg');}
const {publicWebsite}=loadModule('lib/capture-server.ts',{'./analysis-server':{analysisConfig:async()=>({})}});
for(const url of ['http://localhost/','http://127.0.0.1/','http://169.254.169.254/','http://[::1]/','file:///etc/passwd','https://user:pass@example.org/','https://example.org:3000/','https://service.internal/'])assert.throws(()=>publicWebsite(url));
assert.equal(publicWebsite('https://linear.app/'),'https://linear.app/');
const {analyzeJson,providerModels}=loadModule('lib/ai-provider.ts');
const originalFetch=globalThis.fetch;
const result={title:'Test',family:'Minimal',note:'Kontrast',vocabulary:['Weißraum'],imageRecipe:'',heroUsage:'Große Überschrift',collection:seed.collections[0].id,collectionReason:'Passende Typografie',newCollection:null};
try{
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.text.format.type,'json_schema');assert.equal(body.input[0].content[1].type,'input_image');return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]});};
 const openai=await analyzeJson({apiKey:'test',model:'vision-model',provider:'openai'},'Deutsch',['data:image/jpeg;base64,AAAA'],{type:'object'},'design_analysis');analysisSchema.parse(openai);assert.equal(openai.title,'Test');
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.anthropic.com/v1/messages');const body=JSON.parse(options.body);assert.equal(body.messages[0].content[1].source.type,'base64');assert.equal(body.tool_choice.name,'design_analysis');assert.equal(options.headers['anthropic-version'],'2023-06-01');return Response.json({stop_reason:'tool_use',content:[{type:'tool_use',name:'design_analysis',input:result}]});};
 assert.deepEqual(await analyzeJson({apiKey:'test',model:'vision-model',provider:'anthropic'},'Deutsch',['data:image/jpeg;base64,AAAA'],{type:'object'},'design_analysis'),result);
 globalThis.fetch=async()=>Response.json({status:'incomplete',output:[]});await assert.rejects(analyzeJson({apiKey:'test',model:'x',provider:'openai'},'',[],{},'design_analysis'),/Unvollständig/);
 globalThis.fetch=async()=>Response.json({error:{message:'private provider details'}},{status:401});await assert.rejects(analyzeJson({apiKey:'test',model:'x',provider:'openai'},'',[],{},'design_analysis'),/API-Schlüssel/);
 globalThis.fetch=async()=>Response.json({data:[{id:'z'},{id:'a',display_name:'A'}]});assert.deepEqual((await providerModels('anthropic','test')).map(m=>m.id),['a','z']);
}finally{globalThis.fetch=originalFetch;}
// Direct upload claims are bound to the authenticated owner, time-limited and single-use.
let claim={owner:'owner',expires:Date.now()+60000};let consumed=false;
const db={query:async sql=>({rows:sql.startsWith('DELETE')?(consumed?[]:(consumed=true,[{id:'ok'}])):[{data:JSON.stringify(claim)}]})};
const {uploadedImage}=loadModule('lib/upload-server.ts',{'./vault-server':{database:()=>db,storage:()=>({BUCKET:{get:async()=>({body:new Uint8Array([255,216,255,0]),httpMetadata:{contentType:'image/jpeg'}})}})},'./vault-data':{readImage:async()=>({bytes:new Uint8Array([255,216,255,0]),ext:'jpg',contentType:'image/jpeg'})}});
const form=new FormData();form.set('imageKey','11111111-1111-4111-8111-111111111111.jpg');
await assert.rejects(uploadedImage(form,'image','other',true),/abgelaufen/);
assert((await uploadedImage(form,'image','owner',true)).key.endsWith('.jpg'));
await assert.rejects(uploadedImage(form,'image','owner',true),/bereits verwendet/);
claim={owner:'owner',expires:0};await assert.rejects(uploadedImage(form,'image','owner',true),/abgelaufen/);
console.log('PASS: 34 curated profiles, collection integrity, public URL filters, OpenAI/Anthropic contracts, incomplete/error responses, dynamic model list, upload ownership/expiry/replay protection.');
