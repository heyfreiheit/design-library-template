import {z} from 'zod';
import {randomUUID,randomBytes} from 'node:crypto';
import {database} from '@/lib/vault-server';
import {withAuth,json,publicUser,rateLimit} from '@/lib/auth-server';
import {hashPassword} from '@/lib/auth-crypto.mjs';
const input=z.object({username:z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,64}$/),name:z.string().trim().min(1).max(80),role:z.enum(['admin','member'])});
const patch=z.object({id:z.string().uuid(),action:z.enum(['update','reset-password']),name:z.string().trim().min(1).max(80).optional(),role:z.enum(['admin','member']).optional(),active:z.boolean().optional()});
export async function GET(request:Request){return withAuth(request,async()=>{
 const {rows}=await database().query('SELECT id,username,name,role,active,must_change_password,created_at,last_login_at FROM vault_users ORDER BY created_at');
 return json({users:rows.map(r=>({...publicUser(r),active:r.active,createdAt:r.created_at,lastLoginAt:r.last_login_at}))});
 },{admin:true});}
export async function POST(request:Request){return withAuth(request,async user=>{
 if(!await rateLimit('manage-users:'+user.id,30))return json({error:'Zu viele Änderungen. Bitte warte kurz.'},429);
 const p=input.safeParse(await request.json());if(!p.success)return json({error:'Bitte Name, Rolle und einen Benutzernamen mit 3–64 Zeichen (a–z, 0–9, Punkt, Bindestrich oder Unterstrich) angeben.'},400);
 const password=randomBytes(18).toString('base64url');
 try{await database().query('INSERT INTO vault_users(id,username,name,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,$5,true)',[randomUUID(),p.data.username,p.data.name,await hashPassword(password),p.data.role]);}
 catch(e){if((e as {code?:string}).code==='23505')return json({error:'Dieser Benutzername ist bereits vergeben.'},409);throw e;}
 return json({username:p.data.username,temporaryPassword:password},201);
 },{admin:true});}
export async function PATCH(request:Request){return withAuth(request,async user=>{
 if(!await rateLimit('manage-users:'+user.id,30))return json({error:'Zu viele Änderungen. Bitte warte kurz.'},429);
 const p=patch.safeParse(await request.json());if(!p.success)return json({error:'Bitte die Eingaben prüfen.'},400);
 const data=p.data;
 if(data.id===user.id)return json({error:'Dein eigenes Passwort änderst du unter „Mein Konto“. Deinen eigenen Admin-Zugang kannst du hier nicht sperren oder ändern.'},400);
 const password=data.action==='reset-password'?randomBytes(18).toString('base64url'):null;
 const hash=password?await hashPassword(password):null;
 const client=await database().connect();
 try{
  await client.query('BEGIN');await client.query('LOCK TABLE vault_users IN EXCLUSIVE MODE');
  const current=(await client.query('SELECT * FROM vault_users WHERE id=$1',[user.id])).rows[0];
  if(!current?.active||current.role!=='admin'){await client.query('ROLLBACK');return json({error:'Deine Berechtigung wurde geändert.'},403);}
  const target=(await client.query('SELECT * FROM vault_users WHERE id=$1',[data.id])).rows[0];
  if(!target){await client.query('ROLLBACK');return json({error:'Benutzer nicht gefunden.'},404);}
  if(hash)await client.query('UPDATE vault_users SET password_hash=$1,must_change_password=true WHERE id=$2',[hash,data.id]);
  else await client.query('UPDATE vault_users SET name=$1,role=$2,active=$3 WHERE id=$4',[data.name??target.name,data.role??target.role,data.active??target.active,data.id]);
  await client.query('DELETE FROM vault_sessions WHERE user_id=$1',[data.id]);await client.query('COMMIT');
  return json({ok:true,...(password?{username:target.username,temporaryPassword:password}:{})});
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 },{admin:true});}
