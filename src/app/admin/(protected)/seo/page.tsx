import { readStore } from '@/lib/store';
import { AdminSeoClient } from '@/components/admin/AdminSeoClient';
export default async function AdminSeoPage(){return <AdminSeoClient initial={(await readStore()).settings}/>;}
