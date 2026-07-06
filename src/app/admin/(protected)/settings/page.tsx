import { readStore } from '@/lib/store';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';
export default async function SettingsPage(){return <AdminSettingsClient initial={(await readStore()).settings}/>;}
