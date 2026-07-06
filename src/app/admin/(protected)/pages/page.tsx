import { readStore } from '@/lib/store';
import { AdminPagesClient } from '@/components/admin/AdminPagesClient';

export default async function AdminPagesPage() {
  return <AdminPagesClient initial={(await readStore()).pages}/>;
}
