import { readStore } from '@/lib/store';
import { AdminBlogClient } from '@/components/admin/AdminBlogClient';
export default async function BlogAdmin(){return <AdminBlogClient initial={(await readStore()).posts}/>;}
