import {z} from 'zod';
import {database} from '@/lib/vault-server';
import {withAuth,json,rateLimit,createSession,sessionCookie} from '@/lib/auth-server';
import {hashPassword,verifyPassword} from '@/lib/auth-crypto.mjs';
const schema=z.object({name:z.string().trim().min(1).max(80),currentPassword:z.string().min(1).max(128),password:z.string().min(12).max(128)});
export async function PUT(request:Request){return withAuth(request,async user=>{
 const p=schema.safeParse(await request.json());if(!p.success)return json({error:'Bitte Name und aktuelles Passwort angeben. Das neue Passwort braucht mindestens 12 Zeichen.'},400);
 if(!await rateLimit('password:'+user.id,8))return json({error:'Zu viele Versuche. Bitte warte 15 Minuten.'},429);
 const row=(await database().query('SELECT password_hash FROM vault_users WHERE id=$1',[user.id])).rows[0];
 if(!await verifyPassword(p.data.currentPassword,row.password_hash))return json({error:'Das aktuelle Passwort ist nicht korrekt.'},400);
 if(p.data.password===p.data.currentPassword)return json({error:'Bitte wähle ein neues Passwort.'},400);
 const hash=await hashPassword(p.data.password);const client=await database().connect();
 try{await client.query('BEGIN');const changed=await client.query('UPDATE vault_users SET name=$1,password_hash=$2,must_change_password=false WHERE id=$3 AND password_hash=$4 AND active=true',[p.data.name,hash,user.id,row.password_hash]);
 if(!changed.rowCount){await client.query('ROLLBACK');return json({error:'Dein Zugang wurde inzwischen geändert. Bitte melde dich erneut an.'},409);}
 await client.query('DELETE FROM vault_sessions WHERE user_id=$1',[user.id]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 const token=await createSession(user.id,hash);return json({ok:true},200,{'Set-Cookie':sessionCookie(token)});
 },{allowPasswordChange:true});}
