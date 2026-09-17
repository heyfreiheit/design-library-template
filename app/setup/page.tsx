import {database,ensureSchema} from '@/lib/vault-server';
import {redirect} from 'next/navigation';
import {SetupForm} from '@/components/vault/setup-form';
export const dynamic='force-dynamic';
export default async function SetupPage(){
 const missing=[];
 if(!process.env.DATABASE_URL)missing.push('DATABASE_URL (Neon/Postgres)');
 if(!process.env.BLOB_READ_WRITE_TOKEN&&!process.env.BLOB_STORE_ID)missing.push('Privater Vercel Blob Store');
 if(Buffer.from(process.env.VAULT_ENCRYPTION_KEY||'','base64').length!==32)missing.push('VAULT_ENCRYPTION_KEY (32 zufällige Bytes als Base64)');
 if((process.env.SETUP_TOKEN||'').length<32)missing.push('SETUP_TOKEN (mindestens 32 zufällige Zeichen)');
 if(process.env.DATABASE_URL)try{await ensureSchema();if((await database().query('SELECT 1 FROM vault_users LIMIT 1')).rows.length)redirect('/login');}catch(e){if(e instanceof Error&&e.message==='NEXT_REDIRECT')throw e;missing.push('Die Datenbankverbindung ist noch nicht erreichbar.');}
 return <SetupForm missing={missing}/>;
}
