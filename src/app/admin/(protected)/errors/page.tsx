import { AdminErrorsClient } from '@/components/admin/AdminErrorsClient';
import { readStore } from '@/lib/store';
export default async function AdminErrors(){return <AdminErrorsClient initial={(await readStore()).errors}/>}
