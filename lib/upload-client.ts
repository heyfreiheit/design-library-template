import {upload} from '@vercel/blob/client';
export async function attachImage(form:FormData,field:string,file:File){
 if(!file.size||file.size>50*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Bitte PNG, JPEG oder WebP bis 50 MB wählen.');
 const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
 const key=crypto.randomUUID()+'.'+ext;
 await upload('images/'+key,file,{access:'private',handleUploadUrl:'/api/upload',multipart:true,contentType:file.type});
 form.set(field+'Key',key);
}
