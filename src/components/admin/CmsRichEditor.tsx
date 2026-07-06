'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Heading1, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Redo2, RemoveFormatting, Underline, Undo2, Unlink } from 'lucide-react';

type Props={value:string;onChange:(html:string)=>void};

export function CmsRichEditor({value,onChange}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const savedRange=useRef<Range|null>(null);
  const [source,setSource]=useState(false);

  useEffect(()=>{if(ref.current&&!source&&ref.current.innerHTML!==value)ref.current.innerHTML=value||'<p>Start writing here…</p>';},[value,source]);

  function remember(){const selection=window.getSelection();if(selection&&selection.rangeCount&&ref.current?.contains(selection.anchorNode))savedRange.current=selection.getRangeAt(0).cloneRange();}
  function restore(){if(!savedRange.current)return;const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(savedRange.current);}
  function sync(){onChange(ref.current?.innerHTML||'');remember();}
  function exec(command:string,arg?:string){ref.current?.focus();restore();document.execCommand(command,false,arg);sync();}
  function format(tag:string){exec('formatBlock',tag);}
  function link(){remember();const url=window.prompt('Enter the full link URL, for example https://example.com');if(!url)return;restore();document.execCommand('createLink',false,url);const selection=window.getSelection();const node=selection?.anchorNode?.parentElement?.closest('a');if(node){node.target='_blank';node.rel='noopener noreferrer';}sync();}
  function image(){const url=window.prompt('Enter image URL');if(!url)return;const alt=window.prompt('Enter image alt text')||'';exec('insertHTML',`<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}"><figcaption>${escapeHtml(alt)}</figcaption></figure>`);}
  function inlineFaq(){const question=window.prompt('FAQ question');const answer=window.prompt('FAQ answer');if(!question||!answer)return;exec('insertHTML',`<details class="article-faq"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`);}

  if(source)return <div><div className="cms-toolbar"><button type="button" onClick={()=>setSource(false)}>Visual editor</button></div><textarea className="cms-source" value={value} onChange={e=>onChange(e.target.value)}/></div>;

  return <div className="cms-rich-wrap">
    <div className="cms-toolbar" aria-label="Content editor toolbar">
      <button type="button" title="H1" onClick={()=>format('h1')}><Heading1 size={17}/></button><button type="button" title="H2" onClick={()=>format('h2')}><Heading2 size={17}/></button><button type="button" title="H3" onClick={()=>format('h3')}><Heading3 size={17}/></button>
      <button type="button" title="Bold" onClick={()=>exec('bold')}><Bold size={17}/></button><button type="button" title="Italic" onClick={()=>exec('italic')}><Italic size={17}/></button><button type="button" title="Underline" onClick={()=>exec('underline')}><Underline size={17}/></button>
      <button type="button" title="Bullet list" onClick={()=>exec('insertUnorderedList')}><List size={17}/></button><button type="button" title="Numbered list" onClick={()=>exec('insertOrderedList')}><ListOrdered size={17}/></button>
      <button type="button" title="Add anchor link" onMouseDown={remember} onClick={link}><Link2 size={17}/></button><button type="button" title="Remove link" onClick={()=>exec('unlink')}><Unlink size={17}/></button><button type="button" title="Add image" onClick={image}><ImagePlus size={17}/></button>
      <button type="button" onClick={inlineFaq}>Add FAQ</button><button type="button" title="Undo" onClick={()=>exec('undo')}><Undo2 size={17}/></button><button type="button" title="Redo" onClick={()=>exec('redo')}><Redo2 size={17}/></button><button type="button" title="Clear formatting" onClick={()=>exec('removeFormat')}><RemoveFormatting size={17}/></button><button type="button" onClick={()=>{sync();setSource(true)}}>HTML</button>
    </div>
    <div ref={ref} className="cms-rich" contentEditable suppressContentEditableWarning onInput={sync} onBlur={sync} onMouseUp={remember} onKeyUp={remember}/>
  </div>;
}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char));}
function escapeAttr(value:string){return escapeHtml(value).replace(/`/g,'&#96;');}
