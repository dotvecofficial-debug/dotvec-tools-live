import Link from 'next/link';
import type { FooterSettings, NavigationLink } from '@/lib/store';
import { Logo } from './Logo';

type PublicPageLink = {
  slug: string;
  navigationLabel: string;
  footerGroup: 'company' | 'resources' | 'legal';
  sortOrder: number;
};

function FooterLink({ link }: { link: NavigationLink }) {
  if (/^https?:\/\//i.test(link.href)) return <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>;
  return <Link href={link.href}>{link.label}</Link>;
}

export function Footer({ pages = [], settings }: { pages?: PublicPageLink[]; settings: FooterSettings }) {
  const automatic = [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
  const columns = settings.columns.filter((column) => column.visible).sort((a, b) => a.sortOrder - b.sortOrder).map((column) => {
    const pageLinks = automatic.filter((page) => page.footerGroup === column.id).map((page) => ({
      id: `page_${page.slug}`,
      label: page.navigationLabel,
      href: `/${page.slug}`,
      visible: true,
      sortOrder: 10_000 + page.sortOrder,
    }));
    const seen = new Set<string>();
    const links = [...column.links.filter((link) => link.visible), ...pageLinks].sort((a, b) => a.sortOrder - b.sortOrder).filter((link) => {
      const key = link.href.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...column, links };
  });
  const year = String(new Date().getFullYear());

  return <footer className="footer"><div className="container"><div className="footer-grid" style={{ gridTemplateColumns: `minmax(260px,2fr) repeat(${Math.max(columns.length, 1)},minmax(140px,1fr))` }}>
    <div><Logo inverse/><p className="footer-description">{settings.description}</p></div>
    {columns.map((column) => <div key={column.id}><h4>{column.title}</h4>{column.links.map((link) => <FooterLink key={`${column.id}-${link.id}-${link.href}`} link={link}/>)}{column.id === 'legal' && settings.showAdminLink && <Link href="/admin/login">Admin Login</Link>}</div>)}
  </div><div className="footer-bottom"><span>{settings.copyrightText.replaceAll('{year}', year)}</span><span>{settings.bottomNote}</span></div></div></footer>;
}
