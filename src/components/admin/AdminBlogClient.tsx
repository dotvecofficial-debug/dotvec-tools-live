'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, FilePlus2, Plus, Save, Trash2, X } from 'lucide-react';
import type { BlogPost, FaqItem } from '@/lib/store';
import { CmsRichEditor } from './CmsRichEditor';
import { errorMessage, requestJson } from '@/lib/client-api';

const emptyPost:BlogPost={id:'',slug:'',title:'',excerpt:'',content:'<h2>New article</h2><p>Write helpful content here.</p>',contentFormat:'html',status:'draft',category:'Guides',tags:[],author:'Dotvec Team',faqs:[],updatedAt:'',metaKeywords:'',canonicalUrl:'',openGraphType:'article',twitterCard:'summary_large_image',robotsIndex:true,robotsFollow:true,schemaJson:''};

function editorHtml(post:BlogPost){if(post.contentFormat==='html'||/^\s*</.test(post.content))return post.content;return post.content.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>').split(/\n\n+/).map(block=>/^<h[1-3]>/.test(block)?block:`<p>${block.replace(/\n/g,'<br>')}</p>`).join('');}

export function AdminBlogClient({initial}:{initial:BlogPost[]}){
  const [posts,setPosts]=useState(initial);const [edit,setEdit]=useState<BlogPost|null>(null);const [message,setMessage]=useState('');const [query,setQuery]=useState('');const [deleting,setDeleting]=useState('');
  const filtered=useMemo(()=>posts.filter(p=>`${p.title} ${p.slug} ${p.category}`.toLowerCase().includes(query.toLowerCase())),[posts,query]);
  function start(post?:BlogPost){setMessage('');setEdit(post?{...post,content:editorHtml(post),contentFormat:'html',faqs:post.faqs||[]}:{...emptyPost,slug:`new-post-${Date.now()}`});}
  async function save(status?: BlogPost['status']) {
    if (!edit) return;
    setMessage('Saving…');
    const payload = { ...edit, status: status || edit.status, contentFormat: 'html' as const };
    try {
      const data = await requestJson<BlogPost>('/api/admin/blog', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setPosts((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setEdit(data);
      setMessage(data.status === 'published' ? 'Published successfully.' : 'Draft saved.');
    } catch (error) {
      setMessage(errorMessage(error, 'Blog post could not be saved.'));
    }
  }
  async function remove(post: BlogPost) {
    if (!window.confirm(`Delete "${post.title}" permanently? This cannot be undone.`)) return;
    const identity = post.id || post.slug;
    setDeleting(identity);
    setMessage('');
    try {
      await requestJson<{ ok: true }>('/api/admin/blog', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ action: 'delete', id: post.id || undefined, slug: post.slug }),
      });
      const next = await requestJson<BlogPost[]>('/api/admin/blog', { cache: 'no-store' });
      setPosts(next);
      if (edit && (edit.id === post.id || edit.slug === post.slug)) setEdit(null);
      setMessage('Blog post deleted successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'Blog post could not be deleted.'));
    } finally {
      setDeleting('');
    }
  }
  function set<K extends keyof BlogPost>(key:K,value:BlogPost[K]){setEdit(current=>current?{...current,[key]:value}:current);}
  function addFaq(){set('faqs',[...(edit?.faqs||[]),{question:'',answer:''}]);}
  function updateFaq(index:number,patch:Partial<FaqItem>){set('faqs',(edit?.faqs||[]).map((faq,i)=>i===index?{...faq,...patch}:faq));}
  function removeFaq(index:number){set('faqs',(edit?.faqs||[]).filter((_,i)=>i!==index));}

  return <div className="cms-page">
    <section className="admin-hero"><div><span>Content Studio</span><h1>Blog CMS</h1><p>Create complete SEO articles with headings, anchor links, images and FAQ schema content.</p></div><button className="cms-btn" onClick={()=>start()}><FilePlus2 size={18}/>New Post</button></section>
    {!edit?<>
      <div className="cms-page-toolbar"><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search blog posts…"/><button className="cms-btn" onClick={()=>start()}><Plus size={17}/>New Post</button></div>{message&&<div className={`status ${message.toLowerCase().includes('fail')||message.toLowerCase().includes('could not')?'error':'success'}`} style={{marginBottom:14}}>{message}</div>}
      <div className="cms-panel cms-table-wrap"><table className="table"><thead><tr><th>Post</th><th>Status</th><th>Category</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map(post=><tr key={post.id||post.slug}><td><b>{post.title}</b><div className="help">/blog/{post.slug}</div></td><td><span className={`badge ${post.status==='published'?'badge-success':'badge-warning'}`}>{post.status}</span></td><td>{post.category}</td><td>{new Date(post.updatedAt).toLocaleDateString()}</td><td><div className="action-row"><button className="btn btn-secondary btn-sm" onClick={()=>start(post)}>Edit</button>{post.status==='published'&&<Link className="btn btn-secondary btn-sm" target="_blank" href={`/blog/${post.slug}`}>View</Link>}<button type="button" className="btn btn-danger btn-sm" disabled={deleting===(post.id||post.slug)} onClick={()=>remove(post)} aria-label={`Delete ${post.title}`}><Trash2 size={15}/>{deleting===(post.id||post.slug)?'Deleting…':''}</button></div></td></tr>)}</tbody></table></div>
    </>:<div className="cms-editor-layout">
      <section className="cms-panel cms-main-editor"><div className="cms-editor-heading"><div><h2>{edit.id?'Edit blog post':'Create blog post'}</h2><p className="muted">Select words and press the link icon to create an anchor link.</p></div><button className="icon-btn" onClick={()=>setEdit(null)} aria-label="Close editor"><X size={19}/></button></div>
        <div className="grid grid-2"><Field label="Post title" value={edit.title} onChange={value=>{set('title',value);if(!edit.id)set('slug',slugify(value));}}/><Field label="Slug" value={edit.slug} onChange={value=>set('slug',slugify(value))}/></div>
        <Field label="Excerpt" value={edit.excerpt} onChange={value=>set('excerpt',value)} area/>
        <div className="field"><label className="label">Article content</label><CmsRichEditor key={edit.id||edit.slug} value={edit.content} onChange={value=>set('content',value)}/></div>
        <div className="cms-faq-builder"><div className="cms-subheading"><h3>FAQs</h3><button className="btn btn-secondary btn-sm" onClick={addFaq}><Plus size={15}/>Add FAQ</button></div>{(edit.faqs||[]).map((faq,index)=><div className="cms-faq-row" key={index}><input className="input" value={faq.question} onChange={e=>updateFaq(index,{question:e.target.value})} placeholder="FAQ question"/><textarea className="textarea" value={faq.answer} onChange={e=>updateFaq(index,{answer:e.target.value})} placeholder="FAQ answer"/><button className="icon-btn" onClick={()=>removeFaq(index)} aria-label="Remove FAQ"><Trash2 size={17}/></button></div>)}</div>
      </section>
      <aside className="cms-panel cms-editor-sidebar"><h3>Publishing</h3><div className="field"><label className="label">Status</label><select className="select" value={edit.status} onChange={e=>set('status',e.target.value as BlogPost['status'])}><option value="draft">Draft</option><option value="published">Published</option></select></div><Field label="Category" value={edit.category} onChange={value=>set('category',value)}/><Field label="Tags (comma separated)" value={edit.tags.join(', ')} onChange={value=>set('tags',value.split(',').map(item=>item.trim()).filter(Boolean))}/><Field label="Author" value={edit.author} onChange={value=>set('author',value)}/><Field label="Cover image URL" value={edit.coverImage||''} onChange={value=>set('coverImage',value)}/><Field label="Cover image alt" value={edit.coverAlt||''} onChange={value=>set('coverAlt',value)}/><hr/><h3>Complete SEO</h3><Field label="SEO title" value={edit.seoTitle||''} onChange={value=>set('seoTitle',value)}/><Field label="Meta description" value={edit.metaDescription||''} onChange={value=>set('metaDescription',value)} area/><Field label="Meta keywords" value={edit.metaKeywords||''} onChange={value=>set('metaKeywords',value)} area/><Field label="Canonical URL" value={edit.canonicalUrl||''} onChange={value=>set('canonicalUrl',value)}/><Field label="Open Graph title" value={edit.openGraphTitle||''} onChange={value=>set('openGraphTitle',value)}/><Field label="Open Graph description" value={edit.openGraphDescription||''} onChange={value=>set('openGraphDescription',value)} area/><Field label="Open Graph image" value={edit.openGraphImage||''} onChange={value=>set('openGraphImage',value)}/><div className="field"><label className="label">Twitter card</label><select className="select" value={edit.twitterCard||'summary_large_image'} onChange={e=>set('twitterCard',e.target.value as 'summary'|'summary_large_image')}><option value="summary_large_image">Summary large image</option><option value="summary">Summary</option></select></div><Field label="Twitter title" value={edit.twitterTitle||''} onChange={value=>set('twitterTitle',value)}/><Field label="Twitter description" value={edit.twitterDescription||''} onChange={value=>set('twitterDescription',value)} area/><Field label="Twitter image" value={edit.twitterImage||''} onChange={value=>set('twitterImage',value)}/><div className="cms-check-row"><label><input type="checkbox" checked={edit.robotsIndex??true} onChange={e=>set('robotsIndex',e.target.checked)}/>Index post</label><label><input type="checkbox" checked={edit.robotsFollow??true} onChange={e=>set('robotsFollow',e.target.checked)}/>Follow links</label></div><Field label="Custom schema JSON-LD" value={edit.schemaJson||''} onChange={value=>set('schemaJson',value)} area/><div className="cms-save-stack"><button className="cms-btn" onClick={()=>save(edit.status)}><Save size={17}/>{edit.status==='published'?'Publish changes':'Save draft'}</button>{edit.status==='published'&&edit.slug&&<Link href={`/blog/${edit.slug}`} target="_blank" className="cms-btn secondary"><Eye size={17}/>Preview</Link>}{message&&<div className="status success">{message}</div>}</div></aside>
    </div>}
  </div>;
}

function Field({label,value,onChange,area=false}:{label:string;value:string;onChange:(value:string)=>void;area?:boolean}){return <div className="field"><label className="label">{label}</label>{area?<textarea className="textarea" value={value} onChange={e=>onChange(e.target.value)}/>:<input className="input" value={value} onChange={e=>onChange(e.target.value)}/>}</div>}
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
