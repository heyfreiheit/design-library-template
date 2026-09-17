import {z} from 'zod';
import {timingSafeEqual,createHash} from 'node:crypto';
import {database,ensureSchema,sameOrigin} from '@/lib/vault-server';
import {hashPassword} from '@/lib/auth-crypto.mjs';
import {createSession,sessionCookie,json,rateLimit,clientAddress} from '@/lib/auth-server';
const schema=z.object({token:z.string().max(256),name:z.string().trim().min(1).max(80),username:z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,64}$/),password:z.string().min(12).max(128)});
export async function POST(request:Request){
 if(!request.headers.get('origin')||!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
 if(Number(request.headers.get('content-length')||0)>4096)return json({error:'Ungültige Eingabe.'},413);
 try{await ensureSchema();if(!await rateLimit('setup:'+clientAddress(request),10))return json({error:'Bitte in 15 Minuten erneut versuchen.'},429);
 const p=schema.safeParse(await request.json());if(!p.success)return json({error:'Bitte Eingaben prüfen. Passwort: mindestens 12 Zeichen.'},400);
 const expected=process.env.SETUP_TOKEN||'';const digest=(s:string)=>createHash('sha256').update(s).digest();
 if(expected.length<32||!timingSafeEqual(digest(expected),digest(p.data.token)))return json({error:'Der Einrichtungsschlüssel ist nicht korrekt.'},403);
 if(Buffer.from(process.env.VAULT_ENCRYPTION_KEY||'','base64').length!==32||(!process.env.BLOB_READ_WRITE_TOKEN&&!process.env.BLOB_STORE_ID))return json({error:'Bitte zuerst Verschlüsselung und privaten Bildspeicher verbinden.'},503);
 const id=crypto.randomUUID(),hash=await hashPassword(p.data.password);const client=await database().connect();
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(928452)');if((await client.query('SELECT 1 FROM vault_users LIMIT 1')).rows.length){await client.query('ROLLBACK');return json({error:'Diese Library ist bereits eingerichtet.'},409);}
 await client.query("INSERT INTO vault_users(id,username,name,password_hash,role) VALUES($1,$2,$3,$4,'admin')",[id,p.data.username,p.data.name,hash]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 const token=await createSession(id,hash);return json({ok:true},201,{'Set-Cookie':sessionCookie(token)});
 }catch{return json({error:'Einrichtung fehlgeschlagen. Bitte Datenbankverbindung prüfen.'},503);}
}
