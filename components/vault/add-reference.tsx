'use client';
import {attachImage} from '@/lib/upload-client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {MotionFields,emptyMotion} from './motion-panel';
import {Upload,Sparkles,Globe,Camera} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import type {Entry,Collection} from '@/lib/briefs';
import type {Analysis} from '@/lib/reference-model';
import {prepareAnalysisImages} from '@/lib/analysis-images';
const blank={title:'',family:'',note:'',vocabulary:'',heroUsage:'',imageRecipe:''};
const newBlank={name:'',description:'',deployFor:'',vocabulary:[] as string[],risk:'',accent:'#AD8969',imageStyle:''};
export function CollectionPicker({value,onChange,collections,newOption=false}:{value:string;onChange:(s:string)=>void;collections:Collection[];newOption?:boolean}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label="Sammlung auswählen"><SelectValue/></SelectTrigger><SelectContent>{collections.map(c=><SelectItem value={c.id} key={c.id}>{c.name}</SelectItem>)}{newOption&&<SelectItem value="new">Neue Sammlung anlegen</SelectItem>}</SelectContent></Select>}
export function AddReference({collections,initialCollection,analysisEnabled,onSaved,onBusy}:{collections:Collection[];initialCollection:string;analysisEnabled:boolean;onSaved:(entry:Entry,collection:Collection|null)=>void;onBusy:(busy:boolean)=>void}){
 const[motion,setMotion]=useState(emptyMotion);
 const[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[fields,setFields]=useState(blank),[collection,setCollection]=useState(initialCollection),[newCollection,setNewCollection]=useState(newBlank),[sourceUrl,setSourceUrl]=useState(''),[kind,setKind]=useState<'section'|'full-page'>('section'),[auto,setAuto]=useState(true),[analyzing,setAnalyzing]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState('');
 const[mode,setMode]=useState<'file'|'website'>('file'),[websiteUrl,setWebsiteUrl]=useState(''),[capturing,setCapturing]=useState(false),[captureInfo,setCaptureInfo]=useState('');
 const generation=useRef(0);const abort=useRef<AbortController|null>(null);
 useEffect(()=>{onBusy(analyzing||saving||capturing);},[analyzing,saving,capturing,onBusy]);
 useEffect(()=>()=>{abort.current?.abort();onBusy(false);},[onBusy]);
 useEffect(()=>{let active=true;const url=file?URL.createObjectURL(file):'';queueMicrotask(()=>{if(active)setPreview(url)});return()=>{active=false;if(url)URL.revokeObjectURL(url)}},[file]);
 async function analyze(selected:File,captureKind:typeof kind){const current=++generation.current;abort.current?.abort();const controller=new AbortController();abort.current=controller;setAnalyzing(true);setError('');setReason('');try{const images=await prepareAnalysisImages(selected);if(current!==generation.current)return;const r=await fetch('/api/analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...images,screenshotKind:captureKind}),signal:controller.signal});const data=await r.json() as {analysis:Analysis;error?:string};if(!r.ok)throw Error(data.error||'Analyse fehlgeschlagen.');if(current!==generation.current)return;const a=data.analysis;setFields({title:a.title,family:a.family,note:a.note,vocabulary:a.vocabulary.join(', '),heroUsage:a.heroUsage,imageRecipe:a.imageRecipe});setCollection(a.collection);setNewCollection(a.newCollection||newBlank);setReason(a.collectionReason);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Analyse fehlgeschlagen.');}finally{if(current===generation.current)setAnalyzing(false);}}
 function selectFile(selected:File|null){if(!selected)return;if(selected.size>50*1024*1024||!['image/png','image/jpeg','image/webp'].includes(selected.type)){setError('Bitte PNG, JPEG oder WebP mit maximal 50 MB wählen.');return;}generation.current++;abort.current?.abort();setCaptureInfo('');setAnalyzing(false);setFile(selected);setFields(blank);setMotion(emptyMotion);setReason('');setError('');if(analysisEnabled&&auto)void analyze(selected,kind);}
 async function capture(){
  if(!websiteUrl.trim()){setError('Bitte einen Website-Link eingeben.');return;}
  const current=++generation.current;abort.current?.abort();const controller=new AbortController();abort.current=controller;setCapturing(true);setError('');setReason('');setCaptureInfo('');
  try{const response=await fetch('/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:websiteUrl.trim()}),signal:controller.signal});
   if(!response.ok){const data=await response.json();throw Error(data.error||'Aufnahme fehlgeschlagen.');}
   const blob=await response.blob();if(current!==generation.current)return;
   const url=decodeURIComponent(response.headers.get('X-Capture-Url')||encodeURIComponent(websiteUrl.trim()));const title=decodeURIComponent(response.headers.get('X-Capture-Title')||'');
   const image=new File([blob],new URL(url).hostname+'-komplette-seite.jpg',{type:'image/jpeg'});
   setFile(image);setKind('full-page');setSourceUrl(url);setFields({...blank,title:title||new URL(url).hostname});
   setCaptureInfo(`Komplette Seite aufgenommen · ${response.headers.get('X-Capture-Width')} × ${response.headers.get('X-Capture-Height')} Pixel · ${(blob.size/1024/1024).toLocaleString('de-DE',{maximumFractionDigits:2})} MB (komprimiertes JPEG)`);
   setCapturing(false);if(analysisEnabled&&auto)await analyze(image,'full-page');
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Aufnahme fehlgeschlagen.');}finally{setCapturing(false);}
 }
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!file){setError('Bitte einen Screenshot auswählen.');return;}setSaving(true);setError('');try{const form=new FormData();await attachImage(form,'image',file);form.set('metadata',JSON.stringify({...fields,...motion.summary||motion.effects.length?{motion}:{},vocabulary:fields.vocabulary.split(',').map(s=>s.trim()).filter(Boolean),collection,newCollection:collection==='new'?newCollection:null,sourceUrl,screenshotKind:kind}));const r=await fetch('/api/references',{method:'POST',body:form});const d=await r.json() as {entry:Entry;collection:Collection|null;error?:string};if(!r.ok)throw Error(d.error||'Speichern fehlgeschlagen.');onSaved(d.entry,d.collection);}catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');}finally{setSaving(false);}}
 return <form onSubmit={submit} className="vault-form">
 <div className="capture-input-tabs" aria-label="Art der Referenz"><button type="button" className={mode==='file'?'active':''} aria-pressed={mode==='file'} disabled={analyzing||saving||capturing} onClick={()=>setMode('file')}><Upload size={17}/>Screenshot hochladen</button><button type="button" className={mode==='website'?'active':''} aria-pressed={mode==='website'} disabled={analyzing||saving||capturing} onClick={()=>setMode('website')}><Globe size={17}/>Website-Link</button></div>
 {mode==='website'&&<section className="website-capture"><label>Website-Link<input type="url" value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} maxLength={2048} placeholder="https://beispiel.de" disabled={analyzing||saving||capturing} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(!analyzing&&!saving&&!capturing)void capture();}}}/></label><p className="subtle">Wir öffnen die öffentliche Seite, laden beim Scrollen Inhalte nach und erstellen einen komprimierten Screenshot der gesamten Seite. Du prüfst das Ergebnis vor dem Speichern.</p><button type="button" className="secondary-btn" disabled={analyzing||saving||capturing||!websiteUrl.trim()} onClick={capture}><Camera size={17}/>{capturing?'Website wird aufgenommen …':analysisEnabled&&auto?'Website aufnehmen & analysieren':'Website aufnehmen'}</button><p className="subtle">Seiten mit Login, Bot-Schutz oder endlosem Scrollen lassen sich eventuell nur per Screenshot-Upload erfassen. Cookie-Banner werden nach Möglichkeit automatisch geschlossen; bevorzugt mit „Ablehnen“ oder „Nur notwendige Cookies“.</p></section>}
 {mode==='file'&&<>
 <fieldset disabled={analyzing||saving||capturing} className="capture-kind"><legend>Was möchtest du speichern?</legend><label><input type="radio" name="captureKind" checked={kind==='section'} onChange={()=>setKind('section')}/>Seitenausschnitt</label><label><input type="radio" name="captureKind" checked={kind==='full-page'} onChange={()=>setKind('full-page')}/>Kompletter Website-Screenshot</label></fieldset>
 </>}
 <div className="analysis-box">{analysisEnabled?<><label className="toggle-row"><span><Sparkles size={16}/> Mit KI ausfüllen</span><Switch checked={auto} onCheckedChange={setAuto} disabled={analyzing||saving||capturing} aria-label="Automatische KI-Analyse"/></label><p>Für die Analyse wird automatisch eine verkleinerte Kopie an deinen gewählten KI-Anbieter gesendet. Dein Original bleibt unverändert. API-Nutzung wird separat abgerechnet. Du prüfst den Vorschlag vor dem Speichern.</p></>:<><strong><Sparkles size={16}/> KI-Analyse vorbereitet</strong><p>Für automatische Titel, Sammlungen und Beschreibungen fehlt noch der KI-API-Zugang. Bis dahin kannst du alle Felder selbst ausfüllen.</p></>}</div>
 {mode==='file'&&<><label className="upload-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!saving&&!analyzing&&!capturing)selectFile(e.dataTransfer.files[0]||null);}}><Upload size={24}/><strong>{file?.name||(kind==='full-page'?'Kompletten Seitenscreenshot auswählen':'Screenshot auswählen oder hier ablegen')}</strong><span>PNG, JPEG oder WebP · maximal 50 MB · volle Bildhöhe bleibt erhalten</span><input disabled={analyzing||saving||capturing} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Screenshot auswählen" onChange={e=>selectFile(e.target.files?.[0]||null)}/></label>
 {kind==='full-page'&&<p className="subtle">Lade einen vorhandenen Screenshot der gesamten Seite hoch oder nutze oben „Website-Link“ für eine automatische Aufnahme.</p>}</>}
 {capturing&&<p role="status" className="analysis-status"><Camera size={16}/>Die Website wird geladen, gescrollt und komprimiert. Das kann bis zu zwei Minuten dauern …</p>}
 {captureInfo&&<p role="status" className="capture-info">{captureInfo}</p>}
 {error&&<p role="alert" className="form-error">{error}</p>}
 {preview&&<div className={'upload-preview-frame '+(kind==='full-page'?'full-page':'')}><img src={preview} alt="Vorschau deines Screenshots"/></div>}
 {analyzing&&<p role="status" className="analysis-status"><Sparkles size={16}/> Die KI analysiert Gestaltung, Typografie und Seitenaufbau …</p>}
 {file&&analysisEnabled&&!analyzing&&<button type="button" className="secondary-btn" disabled={saving||capturing} onClick={()=>analyze(file,kind)}><Sparkles size={16}/>{reason?'Erneut mit KI ausfüllen':'Mit KI ausfüllen'}</button>}
 {reason&&<div className="analysis-box" role="status"><strong>Vorschlag für deine Sammlung</strong><p>{reason}</p><p>Alle Angaben darunter kannst du vor dem Speichern bearbeiten.</p></div>}
 <fieldset disabled={analyzing||saving||capturing} className="reference-fields">
 <label>Originale Inspirationswebsite (optional)<input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://beispiel.de" maxLength={2048}/></label>
 <label>Name<input value={fields.title} onChange={e=>setFields({...fields,title:e.target.value})} required maxLength={120} placeholder="Ein Name, den du wiedererkennst"/></label>
 <label>Sammlung<CollectionPicker value={collection} onChange={setCollection} collections={collections} newOption/></label>
 {collection==='new'&&<div className="new-collection"><label>Name der neuen Sammlung<input required maxLength={100} value={newCollection.name} onChange={e=>setNewCollection({...newCollection,name:e.target.value})}/></label><label>Beschreibung der Sammlung<textarea required maxLength={2000} rows={3} value={newCollection.description} onChange={e=>setNewCollection({...newCollection,description:e.target.value})}/></label></div>}
 <label>Ästhetische Einordnung<input value={fields.family} maxLength={250} onChange={e=>setFields({...fields,family:e.target.value})}/></label>
 <label>Die Idee dahinter<textarea rows={3} value={fields.note} maxLength={5000} onChange={e=>setFields({...fields,note:e.target.value})}/></label>
 <label>Designvokabular, durch Kommas getrennt<textarea rows={2} value={fields.vocabulary} maxLength={2000} onChange={e=>setFields({...fields,vocabulary:e.target.value})}/></label>
 <label>Komposition & Platzierung<textarea rows={3} value={fields.heroUsage} maxLength={5000} onChange={e=>setFields({...fields,heroUsage:e.target.value})}/></label>
 <MotionFields value={motion} onChange={setMotion}/><label>Bildrezept<textarea rows={3} value={fields.imageRecipe} maxLength={5000} onChange={e=>setFields({...fields,imageRecipe:e.target.value})}/></label>
 </fieldset>
 <button type="submit" className="primary-btn" disabled={saving||analyzing||capturing||!file}>{saving?'Wird gespeichert …':capturing?'Aufnahme läuft …':analyzing?'Analyse läuft …':'Referenz speichern'}</button>
 </form>;
}
