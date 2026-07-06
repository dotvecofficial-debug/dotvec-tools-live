'use client';
import { useEffect } from 'react';
export function AdminBodyClass(){useEffect(()=>{document.body.classList.add('admin-route');return()=>document.body.classList.remove('admin-route')},[]);return null}
