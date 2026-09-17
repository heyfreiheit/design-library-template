import {database,ensureSchema} from '@/lib/vault-server';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {SESSION_COOKIE,userForToken} from '@/lib/auth-server';
import {LoginForm} from '@/components/vault/login-form';
export const dynamic='force-dynamic';
export default async function LoginPage(){if(!process.env.DATABASE_URL)redirect('/setup');await ensureSchema();if(!(await database().query('SELECT 1 FROM vault_users LIMIT 1')).rows.length)redirect('/setup');const user=await userForToken((await cookies()).get(SESSION_COOKIE)?.value||'');if(user)redirect(user.mustChangePassword?'/account':'/');return <LoginForm/>;}
