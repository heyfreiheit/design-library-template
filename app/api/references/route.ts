import {uploadedImage} from '@/lib/upload-server';
import {withAuth} from '@/lib/auth-server';
import {storage,sameOrigin,unavailable} from '@/lib/vault-server';
import {getCollections,getReference} from '@/lib/vault-data';
import {referenceFields,sourceUrlSchema} from '@/lib/reference-model';
export async function POST(request:Request){return withAuth(request,async user=>{
 if(!sameOrigin(request))return Response.json({error:'Ungültiger Ursprung.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>128*1024)return Response.json({error:'Maximal 50 MB pro Screenshot.'},{status:413});
 try{
 const form=await request.formData();let input;try{input=referenceFields.parse(JSON.parse(String(form.get('metadata')||'{}')));}catch{return Response.json({error:'Bitte prüfe Titel, Sammlung und Beschreibungen.'},{status:400});}
 const collections=await getCollections();let collection=collections.find(c=>c.id===input.collection);let createdCollection;
 if(input.collection==='new'&&input.newCollection){const existing=collections.find(c=>c.name.toLocaleLowerCase()===input.newCollection!.name.toLocaleLowerCase());collection=existing||{...input.newCollection,id:crypto.randomUUID()};if(!existing)createdCollection=collection;}
 if(!collection)return Response.json({error:'Bitte eine vorhandene oder neue Sammlung wählen.'},{status:400});
 let image;try{image=await uploadedImage(form,'image',user.id,true);if(!image)throw Error('Bild fehlt.');}catch(e){return Response.json({error:(e as Error).message},{status:400});}

 const {DB,BUCKET}=storage();const id=crypto.randomUUID(),key=image.key,now=new Date().toISOString();
 const {newCollection:_,...fields}=input;const entry={...fields,id,file:key,uploaded:true,collection:collection.id,family:input.family||collection.name,vocabulary:input.vocabulary.length?input.vocabulary:collection.vocabulary,imageRecipe:input.imageRecipe||collection.imageStyle,heroUsage:input.heroUsage||'Die Referenz als Ausgangspunkt für Komposition und Hierarchie verwenden.',added:now,createdBy:user.id,updatedBy:user.id};
 
 try{const statements=[];if(createdCollection)statements.push(DB.prepare('INSERT INTO vault_collections (id, data) VALUES (?, ?)').bind(createdCollection.id,JSON.stringify(createdCollection)));statements.push(DB.prepare('INSERT INTO vault_references (id, data, created_at) VALUES (?, ?, ?)').bind(id,JSON.stringify(entry),now));await DB.batch(statements);}catch(error){await BUCKET.delete(key);throw error;}
 return Response.json({entry,collection:createdCollection||null},{status:201});
 }catch(error){return unavailable(error);}
});}
export async function PATCH(request:Request){return withAuth(request,async user=>{
 if(!sameOrigin(request))return Response.json({error:'Ungültiger Ursprung.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>128*1024)return Response.json({error:'Maximal 50 MB pro Screenshot.'},{status:413});
 try{const form=await request.formData();const id=String(form.get('id')||'');const entry=await getReference(id);if(!entry)return Response.json({error:'Referenz nicht gefunden.'},{status:404});const parsed=sourceUrlSchema.safeParse(String(form.get('sourceUrl')||''));if(!parsed.success)return Response.json({error:parsed.error.issues[0].message},{status:400});
 let fields={};if(form.has('metadata')){const parsedFields=referenceFields.safeParse(JSON.parse(String(form.get('metadata'))));if(!parsedFields.success)return Response.json({error:'Bitte Titel, Sammlung und Beschreibungen prüfen.'},{status:400});const {newCollection:_,...edit}=parsedFields.data;if(!(await getCollections()).some(c=>c.id===edit.collection))return Response.json({error:'Bitte eine vorhandene Sammlung wählen.'},{status:400});fields=edit;}
 let image;try{image=await uploadedImage(form,'fullPage',user.id);}catch(e){return Response.json({error:(e as Error).message},{status:400});}
 const {DB,BUCKET}=storage();const key=image?image.key:null;const updated={...entry,...fields,updatedBy:user.id,updatedAt:new Date().toISOString(),sourceUrl:parsed.data,...(key?{fullPageFile:key}:{})};
 try{const result=await DB.prepare(`INSERT INTO vault_references (id, data, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data WHERE json_extract(vault_references.data,'$.deletedAt') IS NULL`).bind(id,JSON.stringify(updated),entry.added).run();if(!result.meta.changes){if(key)await BUCKET.delete(key);return Response.json({error:'Die Referenz wurde inzwischen gelöscht.'},{status:404});}}catch(error){if(key)await BUCKET.delete(key);throw error;}
 if(key&&entry.fullPageFile)await BUCKET.delete(entry.fullPageFile).catch(()=>{});
 return Response.json({entry:updated});
 }catch(error){return unavailable(error);}
});}

export async function DELETE(request:Request){return withAuth(request,async user=>{
 if(Number(request.headers.get('content-length')||0)>4096)return Response.json({error:'Ungültige Anfrage.'},{status:400});
 const input=await request.json();const id=input?.id;
 if(typeof id!=='string'||!id||id.length>150)return Response.json({error:'Bitte eine Referenz angeben.'},{status:400});
 const entry=await getReference(id);if(!entry)return Response.json({error:'Referenz nicht gefunden.'},{status:404});
 const {DB,BUCKET}=storage();
 // Keep a tombstone so bundled demo references never reappear after a reload.
 await DB.prepare('INSERT INTO vault_references (id, data, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data').bind(id,JSON.stringify({id,deletedAt:new Date().toISOString(),deletedBy:user.id}),entry.added).run();
 const files=new Set([...(entry.uploaded?[entry.file]:[]),...(entry.fullPageFile?[entry.fullPageFile]:[]),...(entry.motionCapture?[entry.motionCapture.videoFile,...entry.motionCapture.frames.map(f=>f.file)]:[])]);
 for(const file of files)await BUCKET.delete(file).catch(()=>console.error('Deleted reference image cleanup failed'));
 return Response.json({id},{headers:{'Cache-Control':'no-store'}});
},{admin:true});}
