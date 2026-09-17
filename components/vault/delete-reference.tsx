'use client';
import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription} from '@/components/ui/alert-dialog';
import type {Entry} from '@/lib/briefs';
export function DeleteReference({entry,onDeleted}:{entry:Entry;onDeleted:(id:string)=>void}){
 const[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function remove(){setBusy(true);setError('');try{const r=await fetch('/api/references',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.id})});const d=await r.json();if(!r.ok)throw Error(d.error||'Löschen fehlgeschlagen.');setOpen(false);onDeleted(entry.id);}catch(e){setError(e instanceof Error?e.message:'Löschen fehlgeschlagen.');}finally{setBusy(false);}}
 return <><button type="button" className="danger-btn" onClick={()=>{setError('');setOpen(true)}}><Trash2 size={15} style={{display:'inline',marginRight:7}}/>Referenz löschen</button><AlertDialog open={open} onOpenChange={v=>{if(!busy)setOpen(v)}}><AlertDialogContent><AlertDialogTitle>Referenz löschen?</AlertDialogTitle><AlertDialogDescription>„{entry.title}“ wird für das gesamte Team aus der Bibliothek entfernt. Hochgeladene Bilder werden ebenfalls gelöscht. Das lässt sich in der App nicht rückgängig machen.</AlertDialogDescription>{error&&<p role="alert" className="form-error">{error}</p>}<div className="row-actions"><button type="button" className="secondary-btn" autoFocus disabled={busy} onClick={()=>setOpen(false)}>Abbrechen</button><button type="button" className="danger-btn" disabled={busy} onClick={remove}>{busy?'Wird gelöscht …':'Endgültig löschen'}</button></div></AlertDialogContent></AlertDialog></>;
}
