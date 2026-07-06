import { readStore } from '@/lib/store';
import { AdminHomeClient } from '@/components/admin/AdminHomeClient';
export default async function AdminHomePage(){return <AdminHomeClient initial={(await readStore()).settings}/>;}
