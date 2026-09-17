import {z} from 'zod';
import {database,sameOrigin} from '@/lib/vault-server';
import {verifyPassword,tokenHash} from '@/lib/auth-crypto.mjs';
import {json,rateLimit,clientAddress,createSession,sessionCookie,publicUser} from '@/lib/auth-server';
const input=z.object({username:z.string().trim().toLowerCase().min(1).max(64),password:z.string().min(1).max(128)});
const dummy='scrypt-v1:'+'0'.repeat(32)+':'+'0'.repeat(128);
export async function POST(request:Request) {
 if(!request.headers.get('origin')||!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
 try {
  if(Number(request.headers.get('content-length')||0)>4096)return json({error:'Ungültige Eingabe.'},400);
  if(!await rateLimit('login-ip:'+tokenHash(clientAddress(request)),40))return json({error:'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.'},429,{'Retry-After':'900'});
  const parsed=input.safeParse(await request.json());if(!parsed.success)return json({error:'Bitte Benutzername und Passwort eingeben.'},400);
  const {username,password}=parsed.data;
  if(!await rateLimit('login-user:'+tokenHash(username),10))return json({error:'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.'},429,{'Retry-After':'900'});
  const {rows}=await database().query('SELECT * FROM vault_users WHERE username=$1',[username]);const row=rows[0];
  const valid=await verifyPassword(password,row?.password_hash||dummy);
  if(!valid||!row?.active)return json({error:'Benutzername oder Passwort ist nicht korrekt.'},401);
  const token=await createSession(row.id,row.password_hash);
  await database().query('UPDATE vault_users SET last_login_at=now() WHERE id=$1',[row.id]);
  await database().query('DELETE FROM vault_rate_limits WHERE key=$1',['login-user:'+tokenHash(username)]);
  return json({user:publicUser(row),redirect:row.must_change_password?'/account':'/'},200,{'Set-Cookie':sessionCookie(token)});
 }catch{return json({error:'Anmeldung momentan nicht möglich. Bitte versuche es erneut.'},503);}
}
