import {z} from 'zod';
import {withAuth,json,rateLimit} from '@/lib/auth-server';
import {analysisConfig,analysisStatus,saveAnalysisConfig} from '@/lib/analysis-server';
import {providerModels} from '@/lib/ai-provider';
const schema=z.object({apiKey:z.string().trim().max(512).optional(),provider:z.enum(['openai','anthropic']),model:z.string().trim().regex(/^[a-zA-Z0-9._:-]{1,150}$/),enabled:z.boolean(),removeKey:z.boolean().optional(),browserKey:z.string().trim().max(512).optional(),removeBrowserKey:z.boolean().optional(),browserRegion:z.enum(['production-ams.browserless.io','production-lon.browserless.io','production-sfo.browserless.io'])});
export async function GET(request:Request){return withAuth(request,async()=>json(await analysisStatus()),{admin:true});}
export async function PUT(request:Request){return withAuth(request,async user=>{
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'Eingabe zu groß.'},413);
 if(!await rateLimit('settings:'+user.id,20))return json({error:'Bitte in 15 Minuten erneut versuchen.'},429);
 const p=schema.safeParse(await request.json());if(!p.success)return json({error:'Bitte Schlüssel, Anbieter und Modell prüfen.'},400);
 const old=await analysisConfig();const apiKey=p.data.removeKey?undefined:p.data.apiKey||(old.provider===p.data.provider?old.apiKey:undefined);
 const browserKey=p.data.removeBrowserKey?undefined:p.data.browserKey||old.browserKey;
 if(apiKey&&(!apiKey.startsWith('sk-')||apiKey.length<20||/\s/.test(apiKey)))return json({error:'Bitte einen gültigen API-Schlüssel eingeben.'},400);
 if(browserKey&&(browserKey.length<10||/\s/.test(browserKey)))return json({error:'Bitte einen gültigen Browserless-Schlüssel eingeben.'},400);
 if(p.data.enabled&&!apiKey&&!p.data.removeKey)return json({error:'Bitte zuerst einen API-Schlüssel für diesen Anbieter hinterlegen.'},400);
 if(apiKey&&(p.data.apiKey||p.data.model!==old.model||p.data.provider!==old.provider))try{const models=await providerModels(p.data.provider,apiKey);if(!models.some((m:{id:string})=>m.id===p.data.model))return json({error:'Dieses Modell ist für deinen Schlüssel nicht verfügbar. Wähle ein Modell aus der Liste.'},400);}catch(e){return json({error:(e as Error).message},400);}
 await saveAnalysisConfig({apiKey,model:p.data.model,enabled:!!apiKey&&p.data.enabled,provider:p.data.provider,browserKey,browserRegion:p.data.browserRegion});return json({...await analysisStatus(),message:'Einstellungen verschlüsselt gespeichert.'});
 },{admin:true});}
