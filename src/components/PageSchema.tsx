import { readStore } from '@/lib/store';
import { parseSchema } from '@/lib/seo';
export async function PageSchema({pageKey}:{pageKey:string}){const store=await readStore();const schema=parseSchema(store.settings.pageSeo[pageKey]?.schemaJson);if(!schema)return null;return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>}
