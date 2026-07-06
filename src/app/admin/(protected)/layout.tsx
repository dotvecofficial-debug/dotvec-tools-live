import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { AdminBodyClass } from '@/components/admin/AdminBodyClass';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!await isAdmin()) redirect('/admin/login');
  return <><AdminBodyClass/><AdminShell>{children}</AdminShell></>;
}
