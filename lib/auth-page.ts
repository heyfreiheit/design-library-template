import {database,ensureSchema} from './vault-server';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {SESSION_COOKIE,userForToken} from './auth-server';
export async function pageUser(options:{admin?:boolean;allowPasswordChange?:boolean}={}) {
  if(!process.env.DATABASE_URL)redirect('/setup');
  await ensureSchema();
  if(!(await database().query('SELECT 1 FROM vault_users LIMIT 1')).rows.length)redirect('/setup');
  const user=await userForToken((await cookies()).get(SESSION_COOKIE)?.value||'');
  if(!user) redirect('/login');
  if(user.mustChangePassword&&!options.allowPasswordChange) redirect('/account');
  if(options.admin&&user.role!=='admin') redirect('/');
  return user;
}
