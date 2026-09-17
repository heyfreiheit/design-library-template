'use client';
import {useState} from 'react';
import {Settings,UserRound,LogOut} from 'lucide-react';
import type {User} from '@/lib/auth-types';
export function LogoutButton(){const[busy,setBusy]=useState(false);const[error,setError]=useState('');return <><button className="nav-link" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const r=await fetch('/api/auth/logout',{method:'POST'});if(!r.ok)throw Error();location.assign('/login');}catch{setError('Abmelden fehlgeschlagen.');setBusy(false);}}}><LogOut size={16}/>{busy?'Wird abgemeldet …':'Abmelden'}</button>{error&&<p role="alert" className="form-error">{error}</p>}</>;}
export function AccountNavigation({user}:{user:User}){return <div className="account-navigation">{user.role==='admin'&&<a className="nav-link" href="/settings"><Settings size={16}/>Einstellungen & Team</a>}<a className="nav-link" href="/account"><UserRound size={16}/>Mein Konto</a><LogoutButton/><div className="profile"><span>{user.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><div>{user.name}<small>{user.role==='admin'?'Admin':'Mitglied'} · heyfreiheit</small></div></div></div>;}
