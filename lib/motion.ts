import {z} from 'zod';
export const motionEffectSchema=z.object({name:z.string().trim().min(1).max(120),location:z.string().max(300),trigger:z.enum(['scroll','entry','click','hover','time','unknown']),description:z.string().max(2000),recipe:z.string().max(2500),confidence:z.enum(['observed','inferred','unverified'])});
export const motionSchema=z.object({summary:z.string().max(3000),limitations:z.string().max(3000),method:z.enum(['manual-browser','sequence-ai','manual']),effects:z.array(motionEffectSchema).max(12)});
export type Motion=z.infer<typeof motionSchema>;
export type MotionCapture={videoFile:string;frames:{file:string;position:number;seconds:number}[];capturedAt:string;url:string;viewport:{width:number;height:number};coverage:string};
export const triggers={scroll:'Scrollfortschritt',entry:'Eintritt ins Sichtfeld',click:'Klick',hover:'Mauszeiger',time:'Zeit / automatischer Ablauf',unknown:'Nicht geprüft'};
export const confidenceLabels={observed:'Beobachtet',inferred:'Abgeleitet',unverified:'Nicht geprüft'};
export function motionBrief(m?:Motion){if(!m)return 'Bewegung & Interaktion: Noch nicht untersucht. Aus einem Einzelbild keine Animationen ableiten.';return `Bewegung & Interaktion: ${m.summary}\n${m.effects.map(e=>`${e.name} (${confidenceLabels[e.confidence]})\nBereich: ${e.location}\nAuslöser: ${triggers[e.trigger]}\nAblauf: ${e.description}\nUmsetzungsidee (kein ausgelesener Originalcode): ${e.recipe}`).join('\n\n')}\nGrenzen der Prüfung: ${m.limitations}\nBeachte prefers-reduced-motion und erhalte die Bedienbarkeit ohne Animationen.`;}
