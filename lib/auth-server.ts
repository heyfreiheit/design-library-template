import {database, sameOrigin, ensureSchema} from './vault-server';
import {newToken, tokenHash} from './auth-crypto.mjs';
import type {User} from './auth-types';
export const SESSION_COOKIE = 'vault_session';
const SESSION_SECONDS = 60*60*24*7;
export function publicUser(row: Record<string, unknown>): User {
  return {id:String(row.id), username:String(row.username), name:String(row.name), role:row.role as User['role'], mustChangePassword:!!row.must_change_password};
}
export function requestToken(request:Request) {
  return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||'';
}
export async function userForToken(token:string):Promise<User|null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  await ensureSchema();
  const {rows} = await database().query(`SELECT u.* FROM vault_sessions s JOIN vault_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[tokenHash(token)]);
  return rows[0] ? publicUser(rows[0]) : null;
}
export function sessionCookie(token:string, clear=false) {
  const secure=process.env.APP_ORIGIN?.startsWith('https:') || process.env.NODE_ENV==='production';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:SESSION_SECONDS}${secure?'; Secure':''}`;
}
export async function createSession(userId:string, expectedHash:string) {
  const token=newToken();
  const result=await database().query("INSERT INTO vault_sessions(token_hash,user_id,expires_at) SELECT $1,id,now()+interval '7 days' FROM vault_users WHERE id=$2 AND password_hash=$3 AND active=true",[tokenHash(token),userId,expectedHash]);
  if(!result.rowCount) throw Error('Account changed during login');
  await database().query('DELETE FROM vault_sessions WHERE expires_at<now()');
  return token;
}
export function json(data:unknown,status=200,headers:Record<string,string>={}) {
  return Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
}
export async function withAuth(request:Request, handler:(user:User)=>Promise<Response>, options:{admin?:boolean; allowPasswordChange?:boolean}={}) {
  try {
    await ensureSchema();
    if (!['GET','HEAD'].includes(request.method) && (!request.headers.get('origin') || !sameOrigin(request))) return json({error:'Ungültiger Ursprung.'},403);
    const user=await userForToken(requestToken(request));
    if (!user) return json({error:'Bitte melde dich erneut an.'},401);
    if (user.mustChangePassword && !options.allowPasswordChange) return json({error:'Bitte ändere zuerst dein vorläufiges Passwort.',code:'PASSWORD_CHANGE_REQUIRED'},403);
    if (options.admin && user.role!=='admin') return json({error:'Dieser Bereich ist nur für Admins freigegeben.'},403);
    return await handler(user);
  } catch(error) {
    if (error instanceof SyntaxError) return json({error:'Bitte die Eingaben prüfen.'},400);
    console.error('Vault request failed:', error instanceof Error ? error.name : 'Unknown');
    return json({error:'Die Anfrage konnte nicht verarbeitet werden. Bitte versuche es erneut.'},503);
  }
}
// Shared Postgres counters apply across processes and survive restarts.
export async function rateLimit(key:string,maximum:number,seconds=900) {
  await ensureSchema();
  const {rows}=await database().query(`INSERT INTO vault_rate_limits(key,hits,reset_at) VALUES($1,1,now()+$2*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN vault_rate_limits.reset_at<now() THEN 1 ELSE vault_rate_limits.hits+1 END,
    reset_at=CASE WHEN vault_rate_limits.reset_at<now() THEN EXCLUDED.reset_at ELSE vault_rate_limits.reset_at END RETURNING hits`,[key,seconds]);
  await database().query('DELETE FROM vault_rate_limits WHERE reset_at<now()');
  return rows[0].hits<=maximum;
}
export function clientAddress(request:Request) {return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';}
