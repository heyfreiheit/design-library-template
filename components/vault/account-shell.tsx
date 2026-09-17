'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowLeft,Moon,Sun} from 'lucide-react';
import {AccountNavigation} from './account-navigation';
import type {User} from '@/lib/auth-types';
export function AccountShell({user,title,subtitle,children}:{user:User;title:string;subtitle:string;children:React.ReactNode}){
 const[light,setLight]=useState(false);useEffect(()=>{const value=localStorage.getItem('taste-vault-theme')==='light';queueMicrotask(()=>setLight(value));document.documentElement.classList.toggle('light',value);},[]);
 return <div className="settings-shell"><aside className="settings-sidebar"><Link className="brand" href="/"><span className="brand-symbol">d</span>Design Library<span className="brand-period">.</span></Link><Link className="secondary-btn back-library" href="/"><ArrowLeft size={16}/>Zur Bibliothek</Link><div className="settings-sidebar-bottom"><AccountNavigation user={user}/></div></aside><main className="settings-main"><header className="settings-header"><div><p className="eyebrow">DEIN ARBEITSBEREICH</p><h1>{title}</h1><p className="subtle">{subtitle}</p></div><button className="icon-btn" aria-label={light?'Dunklen Modus aktivieren':'Hellen Modus aktivieren'} onClick={()=>{const next=!light;setLight(next);document.documentElement.classList.toggle('light',next);localStorage.setItem('taste-vault-theme',next?'light':'dark');}}>{light?<Moon size={18}/>:<Sun size={18}/>}</button></header>{children}</main></div>;
}
