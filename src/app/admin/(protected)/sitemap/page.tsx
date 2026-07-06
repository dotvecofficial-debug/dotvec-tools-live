import { readStore } from '@/lib/store';
import { AdminSitemapClient } from '@/components/admin/AdminSitemapClient';
export default async function AdminSitemapPage(){return <AdminSitemapClient initial={(await readStore()).settings}/>;}
