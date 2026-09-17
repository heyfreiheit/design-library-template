import {Pool,type PoolClient} from 'pg';
import {put,get,del} from '@vercel/blob';
import {schemaSql} from './schema';
let pool:Pool|undefined;
export function database(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});}
// Keep the route storage contract stable while replacing the managed D1 backend.
function postgresSql(sql:string){let n=0;return sql.replace(/json_extract\(vault_references.data,'\$\.deletedAt'\)/g,"(vault_references.data::jsonb ->> 'deletedAt')").replace(/json_extract\(data,'\$\.token'\)/g,"(data::jsonb ->> 'token')").replace(/json_extract\(vault_preferences.data,'\$\.until'\)/g,"((vault_preferences.data::jsonb ->> 'until')::bigint)").replace(/\?/g,()=>'$'+(++n));}
class Statement{
 constructor(readonly sql:string,readonly values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.sql,values)}
 async execute(client?:PoolClient){return (client||database()).query(postgresSql(this.sql),this.values)}
 async first<T>(){return (await this.execute()).rows[0] as T|null||null}
 async all<T>(){return {results:(await this.execute()).rows as T[]}}
 async run(){return {meta:{changes:(await this.execute()).rowCount||0}}}
}
const DB={prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){const client=await database().connect();try{await client.query('BEGIN');for(const statement of statements)await statement.execute(client);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}};
function imageFile(key:string){if(!/^[0-9a-f-]{36}\.(png|jpg|webp|webm)$/.test(key))throw Error('Invalid image key');return 'images/'+key;}
const BUCKET={
 async put(key:string,bytes:Uint8Array,_options?:unknown){await put(imageFile(key),Buffer.from(bytes),{access:'private',addRandomSuffix:false,contentType:key.endsWith('.webm')?'video/webm':key.endsWith('.jpg')?'image/jpeg':'image/'+key.split('.').pop()});},
 async delete(key:string){await del(imageFile(key));},
 async get(key:string){const result=await get(imageFile(key),{access:'private'});if(!result||result.statusCode!==200)return null;const bytes=new Uint8Array(await new Response(result.stream).arrayBuffer());return {body:bytes,httpMetadata:{contentType:result.blob.contentType}};}
};
let schemaReady:Promise<void>|undefined;
export function ensureSchema(){return schemaReady??=(async()=>{const client=await database().connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(928451)');await client.query(schemaSql);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}})().catch(error=>{schemaReady=undefined;throw error;});}
export function storage(){return{DB,BUCKET};}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');const expected=process.env.APP_ORIGIN||new URL(request.url).origin;return !origin||origin===expected;}
export function unavailable(error:unknown){console.error('Vault storage:',error instanceof Error?error.message:'Unknown error');return Response.json({error:'Die Bibliothek ist gerade nicht erreichbar. Bitte versuche es erneut. Deine Eingaben bleiben erhalten.'},{status:503});}
