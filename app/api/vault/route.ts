import {withAuth} from '@/lib/auth-server';
import seed from '@/data/gallery.json';
import {storage,unavailable} from '@/lib/vault-server';
import {getCollections} from '@/lib/vault-data';
import {analysisConfig} from '@/lib/analysis-server';
export async function GET(request:Request){return withAuth(request,async user=>{try{const {DB}=storage();const [rows,prefs,collections]=await Promise.all([DB.prepare('SELECT data FROM vault_references ORDER BY created_at DESC').all<{data:string}>(),DB.prepare('SELECT data FROM vault_preferences WHERE id = ?').bind('user:'+user.id).first<{data:string}>(),getCollections()]);const saved=rows.results.map(r=>JSON.parse(r.data));const ids=new Set(saved.map(e=>e.id));return Response.json({...seed,collections,meta:{...seed.meta,owner:user.name},entries:[...saved.filter(e=>!e.deletedAt),...seed.entries.filter(e=>!ids.has(e.id))],preferences:prefs?JSON.parse(prefs.data):null,analysisEnabled:await analysisConfig().then(c=>!!c.apiKey&&c.enabled)},{headers:{'Cache-Control':'no-store'}});}catch(error){return unavailable(error);}});}
