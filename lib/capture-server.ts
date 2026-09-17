import puppeteer,{type Page} from 'puppeteer-core';
import sharp from 'sharp';
import {analysisConfig} from './analysis-server';
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export function publicWebsite(value:string){const u=new URL(value);const h=u.hostname.toLowerCase();if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port)||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||!h.includes('.')||h.includes(':')||/^\d+\.\d+\.\d+\.\d+$/.test(h))throw Error('Bitte eine öffentliche Website mit Domainnamen eingeben.');return u.href;}
async function dismissCookies(page:Page){
 for(let pass=0;pass<3;pass++){let clicked=false;
 for(const frame of page.frames())try{clicked=await frame.evaluate((accepting)=>{
 const known=accepting?'#onetrust-accept-btn-handler,#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll,[data-testid="uc-accept-all-button"]':'#onetrust-reject-all-handler,#CybotCookiebotDialogBodyButtonDecline,[data-testid="uc-deny-all-button"]';
 const visible=(e:Element)=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
 const direct=[...document.querySelectorAll<HTMLElement>(known)].find(visible);if(direct){direct.click();return true;}
 const names=accepting?/^(accept all|allow all|alle akzeptieren|alle cookies akzeptieren|akzeptieren|accept)$/i:/^(reject all|reject|decline|alle ablehnen|ablehnen|nur notwendige cookies|nur notwendige|only necessary|necessary only|continue without accepting)$/i;
 for(const box of document.querySelectorAll('[role="dialog"],[role="alertdialog"],[id*="cookie" i],[id*="consent" i],[class*="cookie-banner" i],[class*="consent-banner" i]')){
 if(!visible(box)||!/cookies?|consent|einwilligung|tracking/i.test(box.textContent||''))continue;
 const button=[...box.querySelectorAll<HTMLElement>('button,[role="button"],a')].find(e=>visible(e)&&names.test((e.innerText||e.getAttribute('aria-label')||'').trim()));if(button){button.click();return true;}
 }return false;
 },pass===2)||clicked;}catch{/* Consent frames may disappear after clicking. */}
 if(clicked)await pause(400);else await pause(350);
 }
}
async function openPage(url:string,motion:boolean){const c=await analysisConfig();if(!c.browserKey)throw Error('Bitte Browserless unter Einstellungen verbinden oder einen Screenshot hochladen.');
 const host=['production-ams.browserless.io','production-lon.browserless.io','production-sfo.browserless.io'].includes(c.browserRegion)?c.browserRegion:'production-ams.browserless.io';
 const endpoint=new URL('wss://'+host+(motion?'':'/chromium'));endpoint.searchParams.set('token',c.browserKey);endpoint.searchParams.set('timeout','150000');if(motion){endpoint.searchParams.set('headless','false');endpoint.searchParams.set('stealth','true');endpoint.searchParams.set('record','true');}
 const browser=await puppeteer.connect({browserWSEndpoint:endpoint.href,protocolTimeout:45000});
 try{const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});await page.setRequestInterception(true);
 // The remote provider supplies browser isolation and blocks private/metadata addresses.
 // This additional filter prevents obvious local URLs, including subresources and redirects.
 page.on('request',req=>{if(req.isInterceptResolutionHandled())return;try{if(!req.url().startsWith('data:')&&!req.url().startsWith('blob:'))publicWebsite(req.url());void req.continue().catch(()=>{});}catch{void req.abort().catch(()=>{});}});
 await page.goto(publicWebsite(url),{waitUntil:'domcontentloaded',timeout:45000});await pause(1800);await dismissCookies(page);return {browser,page};
 }catch(e){await browser.close().catch(()=>{});throw e;}
}
export async function captureWebsite(url:string){const {browser,page}=await openPage(url,false);try{
 let stable=0,previous=0;for(let step=0;step<65;step++){const metrics=await page.evaluate(()=>({height:document.documentElement.scrollHeight,y:scrollY}));if(metrics.height>60000)throw Error('Die Seite ist zu lang für eine vollständige Aufnahme. Bitte einen eigenen Screenshot hochladen.');if(metrics.height===previous&&metrics.y+1000>=metrics.height)stable++;else stable=0;if(stable>=3)break;previous=metrics.height;await page.mouse.wheel({deltaY:900});await pause(180);}
 await page.evaluate(()=>window.scrollTo(0,0));await pause(600);await dismissCookies(page);
 const height=await page.evaluate(()=>Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));if(height>60000)throw Error('Die Seite überschreitet die maximale Aufnahmehöhe.');
 const raw=await page.screenshot({type:'jpeg',quality:75,fullPage:true,captureBeyondViewport:true});
 for(const quality of [72,58,42,30]){const bytes=await sharp(raw,{limitInputPixels:120000000}).jpeg({quality,mozjpeg:true}).toBuffer();if(bytes.length<=3*1024*1024)return{bytes,width:1440,height,title:(await page.title()).slice(0,120),url:publicWebsite(page.url())};}
 throw Error('Die Aufnahme ist zu groß. Bitte einen Screenshot hochladen.');
 }finally{await browser.close().catch(()=>{});}}
export async function captureMotion(url:string){const {browser,page}=await openPage(url,true);try{
 const cdp=await page.createCDPSession();await cdp.send('Browserless.startRecording' as never);const start=Date.now();const frames:{data:string;position:number;seconds:number;label:string}[]=[],positions:unknown[]=[];
 const sample=async(label:string)=>{const metrics=await page.evaluate(()=>({y:Math.round(scrollY),height:document.documentElement.scrollHeight,elements:[...document.querySelectorAll('header,main img,main video')].slice(0,15).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{tag:e.tagName,top:Math.round(r.top),height:Math.round(r.height),opacity:s.opacity,transform:s.transform};})}));const raw=await page.screenshot({type:'jpeg',quality:55});const bytes=await sharp(raw).resize({width:960}).jpeg({quality:55}).toBuffer();frames.push({data:bytes.toString('base64'),position:metrics.y,seconds:Math.round((Date.now()-start)/100)/10,label});positions.push({label,...metrics});};
 await sample('Start');await pause(1500);await sample('Gleiche Position nach Wartezeit');
 for(let i=0;i<18;i++){await page.mouse.wheel({deltaY:500});await pause(450);if([3,7,11,17].includes(i))await sample('Abwärts '+(i+1));}
 await page.mouse.wheel({deltaY:-1000});await pause(600);await sample('Zurückscrollen');
 const recording=await cdp.send('Browserless.stopRecording' as never,{encoding:'base64'} as never) as {value:string};
 const video=Buffer.from(recording.value,'base64');if(video.length>30*1024*1024||!video.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))throw Error('Die Videoaufnahme ist ungültig oder zu groß.');
 return{video:video.toString('base64'),frames,positions,url:publicWebsite(page.url()),viewport:{width:1440,height:1000},coverage:'Desktop-Stichprobe: Wartezeit, erste 9.000 Scrollpixel und 1.000 Pixel zurück. Keine Hover-/Klickprüfung, keine vollständige Seitenprüfung. Ein Bildwechsel beim Scrollen beweist keine Animation.'};
 }finally{await browser.close().catch(()=>{});}}
