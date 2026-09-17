import {get} from '@vercel/blob';
import {withAuth} from '@/lib/auth-server';
export const maxDuration=60;
export async function GET(request:Request,{params}:{params:Promise<{key:string}>}){return withAuth(request,async()=>{
 const {key}=await params;if(!/^[0-9a-f-]{36}\.(png|jpg|webp|webm)$/.test(key))return new Response('Not found',{status:404});
 const result=await get('images/'+key,{access:'private'});if(!result||result.statusCode!==200)return new Response('Not found',{status:404});
 return new Response(result.stream,{headers:{'Content-Type':result.blob.contentType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
});}
