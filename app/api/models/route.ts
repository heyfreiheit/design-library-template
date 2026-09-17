import {withAuth,json,rateLimit} from '@/lib/auth-server';
import {analysisConfig} from '@/lib/analysis-server';
import {providerModels} from '@/lib/ai-provider';
import {z} from 'zod';
export async function POST(request:Request){return withAuth(request,async user=>{if(!await rateLimit('models:'+user.id,20))return json({error:'Bitte später erneut versuchen.'},429);if(Number(request.headers.get('content-length')||0)>2048)return json({error:'Eingabe zu groß.'},413);const p=z.object({provider:z.enum(['openai','anthropic']),apiKey:z.string().max(512).optional()}).safeParse(await request.json());if(!p.success)return json({error:'Anbieter prüfen.'},400);const c=await analysisConfig();const key=p.data.apiKey||(c.provider===p.data.provider?c.apiKey:undefined);if(!key)return json({error:'Bitte zuerst den API-Schlüssel eingeben.'},400);try{return json({models:await providerModels(p.data.provider,key)});}catch(e){return json({error:(e as Error).message},400);}},{admin:true});}
