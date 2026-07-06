'use client';
import { AlertTriangle, CheckCircle2, Download, FileUp, RotateCcw, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToolRunnerText } from './ToolRunnerCustomization';

export function FileInput({accept,multiple=false,onFiles,maxMB=50}:{accept?:string;multiple?:boolean;onFiles:(files:File[])=>void;maxMB?:number}){
 const [drag,setDrag]=useState(false); const ref=useRef<HTMLInputElement>(null); const [error,setError]=useState('');
 const labels=useToolRunnerText();
 function select(files:FileList|null){if(!files)return;const arr=Array.from(files);const oversized=arr.find(f=>f.size>maxMB*1024*1024);if(oversized){setError(`${oversized.name} exceeds the ${maxMB} MB limit.`);return;}setError('');onFiles(arr)}
 const uploadTitle=multiple?'Drag and drop files here':'Drag and drop a file here';
 return <div><div className={`dropzone ${drag?'drag':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);select(e.dataTransfer.files)}} onClick={()=>ref.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')ref.current?.click()}}><input ref={ref} type="file" accept={accept} multiple={multiple} onChange={e=>select(e.target.files)}/><FileUp size={36} color="var(--primary)" style={{margin:'0 auto 12px'}}/><b>{uploadTitle}</b><p className="muted" style={{margin:'6px 0 12px'}}>or click to browse · maximum {maxMB} MB</p><span className="btn btn-secondary btn-sm">Browse files</span></div>{error&&<div className="status error" style={{marginTop:10}}><AlertTriangle size={16}/> {error}</div>}</div>
}

export function PrivacyNote({server=false}:{server?:boolean}){const labels=useToolRunnerText();const message=labels.privacyMessage||(server?'This tool uploads files temporarily for processing and deletes them after completion.':'Your files are processed locally in your browser and are never uploaded to our servers.');return <div className="status"><ShieldCheck size={16} style={{verticalAlign:'middle',marginRight:7}}/>{message}</div>}
export function Message({type='info',children}:{type?:'info'|'error'|'success';children:React.ReactNode}){return <div className={`status ${type}`}>{type==='success'?<CheckCircle2 size={16} style={{verticalAlign:'middle',marginRight:7}}/>:type==='error'?<AlertTriangle size={16} style={{verticalAlign:'middle',marginRight:7}}/>:null}{children}</div>}
export function DownloadButton({url,name,label='Download result'}:{url:string;name:string;label?:string}){return <a className="btn btn-primary" href={url} download={name}><Download size={18}/>{label}</a>}
export function ResetButton({onClick}:{onClick:()=>void}){const labels=useToolRunnerText();return <button className="btn btn-secondary" onClick={onClick}><RotateCcw size={18}/>{labels.resetButtonText||'Reset'}</button>}
export function OutputCode({value}:{value:string}){const labels=useToolRunnerText();return <pre className="output-code">{value||(labels.resultEmptyText||'Output will appear here.')}</pre>}
export async function fileToDataUrl(file:File):Promise<string>{return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
export function downloadText(text:string,name:string,type='text/plain'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function copyText(text:string){return navigator.clipboard.writeText(text)}
