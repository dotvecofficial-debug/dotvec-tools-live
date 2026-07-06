import { getEffectiveTools } from '@/lib/overrides';
import { AdminToolsClient } from '@/components/admin/AdminToolsClient';
export default async function ToolsAdmin(){return <AdminToolsClient initial={await getEffectiveTools()}/>;}
