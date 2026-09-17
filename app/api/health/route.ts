import {storage} from '@/lib/vault-server';
export const dynamic='force-dynamic';
export async function GET(){try{await storage().DB.prepare('SELECT 1').first();return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'unavailable'},{status:503});}}
