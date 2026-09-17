import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {withAuth,json,rateLimit} from '@/lib/auth-server';
import {database,storage} from '@/lib/vault-server';
export async function POST(request:Request){return withAuth(request,async user=>{
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'Ungültige Anfrage.'},413);
 if(!await rateLimit('upload:'+user.id,60,600))return json({error:'Bitte warte vor weiteren Uploads.'},429);
 const expired=await database().query("SELECT id FROM vault_preferences WHERE id LIKE 'upload:%' AND (data::jsonb->>'expires')::bigint < $1 LIMIT 10",[Date.now()]);
 for(const row of expired.rows){try{await storage().BUCKET.delete(row.id.slice(7));await database().query('DELETE FROM vault_preferences WHERE id=$1',[row.id]);}catch{/* Retry cleanup on the next upload. */}}
 const body=await request.json() as HandleUploadBody;
 if(body.type!=='blob.generate-client-token')return json({error:'Ungültige Anfrage.'},400);
 const result=await handleUpload({request,body,onBeforeGenerateToken:async pathname=>{
 if(!/^images\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(pathname))throw Error('Ungültiger Bildpfad.');
 await database().query('INSERT INTO vault_preferences(id,data) VALUES($1,$2)', ['upload:'+pathname.slice(7),JSON.stringify({owner:user.id,expires:Date.now()+3600000})]);
 return {allowedContentTypes:['image/jpeg','image/png','image/webp'],maximumSizeInBytes:50*1024*1024,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+600000};
 }});return json(result);
});}
