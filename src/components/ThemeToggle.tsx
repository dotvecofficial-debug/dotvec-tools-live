'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
export function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{const saved=localStorage.getItem('dotvec-theme'); const d=saved==='dark'||(!saved&&matchMedia('(prefers-color-scheme: dark)').matches);setDark(d);document.documentElement.dataset.theme=d?'dark':'light'},[]);
 function toggle(){const n=!dark;setDark(n);document.documentElement.dataset.theme=n?'dark':'light';localStorage.setItem('dotvec-theme',n?'dark':'light')}
 return <button className="icon-btn" onClick={toggle} aria-label="Toggle color theme">{dark?<Sun size={19}/>:<Moon size={19}/>}</button>
}
