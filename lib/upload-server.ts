import {storage,database} from './vault-server';
import {readImage} from './vault-data';
export async function uploadedImage(form:FormData,field:string,userId:string,required=false){
 const key=String(form.get(field+'Key')||'');
 if(!key){if(required)throw Error('Bitte einen Screenshot hochladen.');return undefined;}
 if(!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key))throw Error('Ungültiger Upload.');
 const {rows}=await database().query('SELECT data FROM vault_preferences WHERE id=$1',['upload:'+key]);
 const claim=rows[0]?JSON.parse(rows[0].data):null;
 if(!claim||claim.owner!==userId||claim.expires<Date.now())throw Error('Der Upload ist abgelaufen. Bitte erneut hochladen.');
 const obj=await storage().BUCKET.get(key);if(!obj)throw Error('Das Bild wurde noch nicht vollständig übertragen.');
 const image=await readImage(new File([obj.body],key,{type:obj.httpMetadata.contentType}));
 // Consume the upload once. This prevents one reference deleting another reference's reused asset.
 const consumed=await database().query('DELETE FROM vault_preferences WHERE id=$1 AND data=$2 RETURNING id',['upload:'+key,rows[0].data]);
 if(!consumed.rows.length)throw Error('Der Upload wurde bereits verwendet.');
 return {...image,key};
}
