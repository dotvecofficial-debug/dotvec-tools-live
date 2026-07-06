'use client';

import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { HeaderSettings } from '@/lib/store';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

type PublicPageLink = { slug: string; navigationLabel: string; sortOrder: number };

function PublicLink({ href, label, onClick, className, style }: { href: string; label: string; onClick?: () => void; className?: string; style?: React.CSSProperties }) {
  if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noreferrer" onClick={onClick} className={className} style={style}>{label}</a>;
  return <Link href={href} onClick={onClick} className={className} style={style}>{label}</Link>;
}

export function Header({ announcement, pages = [], settings }: { announcement?: string; pages?: PublicPageLink[]; settings: HeaderSettings }) {
  const [open, setOpen] = useState(false);
  const allLinks = useMemo(() => {
    const configured = settings.links.filter((link) => link.visible).map((link) => ({ href: link.href, label: link.label, sortOrder: link.sortOrder }));
    const automatic = [...pages].sort((a, b) => a.sortOrder - b.sortOrder).map((page) => ({ href: `/${page.slug}`, label: page.navigationLabel, sortOrder: 10_000 + page.sortOrder }));
    const seen = new Set<string>();
    return [...configured, ...automatic].sort((a, b) => a.sortOrder - b.sortOrder).filter((item) => {
      const key = item.href.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [pages, settings.links]);

  return <>
    {announcement && <div className="announcement">{announcement}</div>}
    <header className="header"><div className="container header-inner"><Logo /><nav className="nav">{allLinks.map((item) => <PublicLink key={`${item.href}-${item.label}`} href={item.href} label={item.label}/>)}</nav><div className="header-actions">{settings.showSearch && <Link href="/all-tools" className="icon-btn" aria-label="Search tools"><Search size={19}/></Link>}{settings.showThemeToggle && <ThemeToggle/>}<button className="icon-btn mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20}/></button></div></div></header>
    {open && <div className="mobile-nav-overlay" onClick={() => setOpen(false)}><aside className="mobile-nav-drawer" onClick={(event) => event.stopPropagation()}><div className="mobile-nav-head"><Logo/><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20}/></button></div><nav className="mobile-nav-links">{allLinks.map((item) => <PublicLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} onClick={() => setOpen(false)}/>)}</nav>{settings.showSearch && <Link href="/all-tools" onClick={() => setOpen(false)} className="btn btn-secondary mobile-nav-tools">Browse all tools</Link>}</aside></div>}
  </>;
}
