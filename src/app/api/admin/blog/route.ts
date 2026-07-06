import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { createId, mutateStore, readStore, type BlogPost } from '@/lib/store';

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json((await readStore()).posts, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

async function postBlog(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as Partial<BlogPost> & { action?: 'delete'; id?: string; slug?: string };

  if (body.action === 'delete') {
    const id = body.id?.trim();
    const slug = body.slug?.trim();
    if (!id && !slug) {
      return NextResponse.json({ error: 'A post id or slug is required.' }, { status: 400 });
    }

    let deleted: BlogPost | undefined;
    await mutateStore((store) => {
      const index = store.posts.findIndex((post) => (id && post.id === id) || (slug && post.slug === slug));
      if (index >= 0) {
        [deleted] = store.posts.splice(index, 1);
        store.activity.unshift({
          id: createId('act'),
          action: 'Blog deleted',
          target: deleted.slug || deleted.id || slug || id,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (!deleted) {
      return NextResponse.json({ error: 'The blog post was not found. It may already have been deleted.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedId: deleted.id || null, deletedSlug: deleted.slug });
  }

  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'Title and slug are required.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const post: BlogPost = {
    id: body.id || createId('post'),
    slug: body.slug.trim(),
    title: body.title.trim(),
    excerpt: body.excerpt || '',
    content: body.content || '',
    contentFormat: body.contentFormat || 'html',
    status: body.status || 'draft',
    category: body.category || 'Guides',
    tags: body.tags || [],
    author: body.author || 'Dotvec Team',
    coverImage: body.coverImage || '',
    coverAlt: body.coverAlt || '',
    faqs: (body.faqs || []).filter((faq) => faq.question.trim() && faq.answer.trim()),
    publishedAt: body.status === 'published' ? (body.publishedAt || now) : undefined,
    updatedAt: now,
    seoTitle: body.seoTitle || body.title,
    metaDescription: body.metaDescription || body.excerpt || '',
    metaKeywords: body.metaKeywords || '',
    canonicalUrl: body.canonicalUrl || '',
    openGraphTitle: body.openGraphTitle || '',
    openGraphDescription: body.openGraphDescription || '',
    openGraphImage: body.openGraphImage || body.coverImage || '',
    openGraphType: 'article',
    twitterCard: body.twitterCard || 'summary_large_image',
    twitterTitle: body.twitterTitle || '',
    twitterDescription: body.twitterDescription || '',
    twitterImage: body.twitterImage || body.openGraphImage || body.coverImage || '',
    robotsIndex: body.robotsIndex ?? true,
    robotsFollow: body.robotsFollow ?? true,
    schemaJson: body.schemaJson || '',
  };

  try {
    await mutateStore((store) => {
      const duplicate = store.posts.find((item) => item.slug === post.slug && item.id !== post.id);
      if (duplicate) throw new Error('Another post already uses this slug.');
      const index = store.posts.findIndex((item) => item.id === post.id);
      if (index >= 0) store.posts[index] = post;
      else store.posts.unshift(post);
      store.activity.unshift({
        id: createId('act'),
        action: post.status === 'published' ? 'Blog published' : 'Blog draft saved',
        target: post.slug,
        createdAt: now,
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save the post.' }, { status: 400 });
  }

  return NextResponse.json(post);
}


export async function POST(req: NextRequest) {
  try {
    return await postBlog(req);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : 'Blog request failed.' },
      { status: 500 },
    );
  }
}
