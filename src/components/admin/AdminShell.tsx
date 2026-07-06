'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCode2,
  FileWarning,
  Globe2,
  Home,
  LineChart,
  LogOut,
  Map,
  Palette,
  Search,
  Settings2,
  Wrench,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const nav = [
  { group: 'Overview', items: [
    { href: '/admin', label: 'Dashboard', Icon: BarChart3 },
    { href: '/admin/analytics', label: 'Live Analytics', Icon: LineChart },
  ] },
  { group: 'Content', items: [
    { href: '/admin/home', label: 'Homepage', Icon: Home },
    { href: '/admin/pages', label: 'Static Pages', Icon: FileCode2 },
    { href: '/admin/tools', label: 'Tools', Icon: Wrench },
    { href: '/admin/blog', label: 'Blog Posts', Icon: BookOpenText },
  ] },
  { group: 'SEO & Appearance', items: [
    { href: '/admin/seo', label: 'SEO Manager', Icon: Globe2 },
    { href: '/admin/sitemap', label: 'Sitemap & Files', Icon: Map },
    { href: '/admin/settings', label: 'Theme Settings', Icon: Palette },
  ] },
  { group: 'System', items: [
    { href: '/admin/errors', label: 'Error Center', Icon: FileWarning },
    { href: '/all-tools', label: 'View Website', Icon: ExternalLink },
  ] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('dotvec-admin-sidebar') === 'collapsed');
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem('dotvec-admin-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  return <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className="admin-side">
      <div className="admin-logo-wrap"><Logo inverse /></div>
      <button className="admin-collapse" onClick={toggle} aria-expanded={!collapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        <span>Collapse</span>
      </button>

      {nav.map((section) => <div className="admin-nav-group" key={section.group}>
        <small>{section.group}</small>
        <nav>{section.items.map(({ href, label, Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return <Link href={href} key={href} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined}>
            <Icon /> <span>{label}</span>
          </Link>;
        })}</nav>
      </div>)}

      <div className="admin-profile">
        <div className="admin-avatar">A</div>
        <div className="admin-profile-copy"><b>Administrator</b><small>CMS Admin</small></div>
      </div>
      <form action="/api/admin/logout" method="post">
        <button className="admin-logout"><LogOut size={17}/><span>Log out</span></button>
      </form>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <div className="admin-global-search"><Search size={18}/><input placeholder="Search CMS…"/><kbd>Ctrl K</kbd></div>
        <div className="admin-top-actions"><Link href="/admin/blog" className="cms-btn">+ New Post</Link><ThemeToggle/></div>
      </header>
      {children}
    </main>
  </div>;
}
