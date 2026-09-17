import {database,sameOrigin} from '@/lib/vault-server';
import {json,requestToken,sessionCookie} from '@/lib/auth-server';
import {tokenHash} from '@/lib/auth-crypto.mjs';
export async function POST(request:Request){
 if(!request.headers.get('origin')||!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
 try{await database().query('DELETE FROM vault_sessions WHERE token_hash=$1',[tokenHash(requestToken(request))]);return json({ok:true},200,{'Set-Cookie':sessionCookie('',true)});}catch{return json({error:'Abmelden fehlgeschlagen. Bitte erneut versuchen.'},503);}
}
