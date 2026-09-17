import {withAuth,json,rateLimit} from '@/lib/auth-server';
import {getReference} from '@/lib/vault-data';
import {storage,database} from '@/lib/vault-server';
import {captureWebsite} from '@/lib/capture-server';
export const maxDuration=180;
export async function POST(request:Request){return withAuth(request,async user=>{
 if(Number(request.headers.get('content-length')||0)>2048)return json({error:'Ungültige Anfrage.'},413);
 const {id,onlyMissing}=await request.json();if(typeof id!=='string'||id.length>150)return json({error:'Referenz fehlt.'},400);
 const entry=await getReference(id);if(!entry?.sourceUrl)return json({error:'Originalwebsite fehlt.'},400);
 if(onlyMissing&&entry.file!=='capture-pending.svg')return json({entry,skipped:true});
 if(!await rateLimit('capture:'+user.id,40,600))return json({error:'Bitte später erneut versuchen.'},429);
 let key='';let saved=false;
 try{const image=await captureWebsite(entry.sourceUrl);key=crypto.randomUUID()+'.jpg';await storage().BUCKET.put(key,image.bytes);
 const patch={file:key,uploaded:true,screenshotKind:'full-page',captureNote:'Komprimierter vollständiger Website-Screenshot · '+image.width+' × '+image.height+' Pixel',updatedBy:user.id,updatedAt:new Date().toISOString()};
 const r=await database().query("INSERT INTO vault_references(id,data,created_at) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET data=(vault_references.data::jsonb || $4::jsonb)::text WHERE vault_references.data::jsonb->>'deletedAt' IS NULL RETURNING data",[id,JSON.stringify({...entry,...patch}),entry.added,JSON.stringify(patch)]);
 if(!r.rows.length)return json({error:'Die Referenz wurde inzwischen gelöscht.'},404);saved=true;if(entry.uploaded)await storage().BUCKET.delete(entry.file).catch(()=>{});return json({entry:JSON.parse(r.rows[0].data)});
 }catch{return json({error:'Aufnahme fehlgeschlagen. Prüfe Browserless in den Einstellungen. Das Designprofil bleibt erhalten.'},502);}finally{if(key&&!saved)await storage().BUCKET.delete(key).catch(()=>{});}
});}
