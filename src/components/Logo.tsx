import { Boxes } from 'lucide-react';
import Link from 'next/link';
export function Logo({ inverse=false }: { inverse?: boolean }) {
  return <Link className="logo" href="/" aria-label="Dotvec Tools home">
    <span className="logo-mark"><Boxes size={21}/></span><span style={{color:inverse?'white':undefined}}>Dotvec Tools</span>
  </Link>;
}
