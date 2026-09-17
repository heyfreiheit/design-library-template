import {withAuth,json,rateLimit} from '@/lib/auth-server';
import {captureWebsite,publicWebsite} from '@/lib/capture-server';
export const runtime='nodejs';
export const maxDuration=180;
export async function POST(request:Request){return withAuth(request,async user=>{
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'Der Link ist zu lang.'},413);
 const input=await request.json();let url;try{url=publicWebsite(String(input.url||''));}catch{return json({error:'Bitte einen öffentlichen Website-Link eingeben.'},400);}
 if(!await rateLimit('capture:'+user.id,40,600))return json({error:'Bitte einige Minuten warten.'},429);
 try{const r=await captureWebsite(url);return new Response(new Uint8Array(r.bytes),{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Capture-Width':String(r.width),'X-Capture-Height':String(r.height),'X-Capture-Title':encodeURIComponent(r.title),'X-Capture-Url':encodeURIComponent(r.url)}});}catch(e){return json({error:e instanceof Error&&e.message.startsWith('Bitte')?e.message:'Website-Aufnahme fehlgeschlagen. Prüfe Browserless-Schlüssel, Kontingent und ob die Website automatische Aufnahmen zulässt. Du kannst weiterhin Screenshots hochladen.'},502);}
});}
