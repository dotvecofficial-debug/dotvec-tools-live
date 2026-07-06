import type { Metadata } from 'next';
import { ManagedStaticPage, managedStaticMetadata } from '@/components/ManagedStaticPage';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { return managedStaticMetadata('privacy-policy'); }
export default function Page() { return <ManagedStaticPage slug="privacy-policy"/>; }
