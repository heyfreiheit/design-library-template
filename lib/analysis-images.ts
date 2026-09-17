// Keep the original File untouched. Decode a smaller working copy for analysis.
export async function prepareAnalysisImages(file:File){
 let image:ImageBitmap;
 try{image=await createImageBitmap(file,{resizeWidth:1400,resizeQuality:'high'});}
 catch{throw Error('Der Browser konnte diesen Screenshot nicht für die Analyse öffnen. Du kannst das Original ohne KI-Analyse speichern.');}
 try{
 const render=(y:number,height:number,width:number,maxHeight:number,quality:number)=>{
  const scale=Math.min(1,width/image.width,maxHeight/height);const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  try{const ctx=canvas.getContext('2d');if(!ctx)throw Error('Bildaufbereitung nicht verfügbar.');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,y,image.width,height,0,0,canvas.width,canvas.height);
   const url=canvas.toDataURL('image/jpeg',quality);if(!url.startsWith('data:image/jpeg;base64,'))throw Error('Die Analysevorschau konnte nicht erstellt werden.');return url;
  }finally{canvas.width=canvas.height=1;}
 };
 const tileHeight=Math.max(1,Math.round(image.width*1.4));const count=Math.ceil(image.height/tileHeight);const sampled=count>8;
 // Reduce analysis copies automatically if detailed/noisy screenshots exceed the API payload budget.
 for(const [width,quality] of [[1400,.8],[1100,.7],[850,.6],[600,.5]]){
  const images=[render(0,image.height,width,2200,quality)];
  if(count>1){const n=Math.min(count,8);for(let i=0;i<n;i++){const y=sampled?Math.round(i*(image.height-tileHeight)/(n-1)):i*tileHeight;images.push(render(y,Math.min(tileHeight,image.height-y),width,2000,quality));}}
  if(images.every(s=>s.length<=2000000)&&images.reduce((sum,s)=>sum+s.length,0)<=3*1024*1024)return{images,sampled};
 }
 throw Error('Die Analysevorschau konnte nicht ausreichend komprimiert werden. Du kannst das Original ohne KI-Analyse speichern.');
 }finally{image.close();}
}
