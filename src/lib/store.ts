import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoFields {
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  openGraphType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  schemaJson?: string;
}

export interface CardAppearanceSettings {
  lightToolBackground: string;
  lightToolText: string;
  lightToolMuted: string;
  lightToolBorder: string;
  lightToolAction: string;
  lightToolIconBackground: string;
  lightToolIconText: string;
  lightCategoryBackground: string;
  lightCategoryText: string;
  lightCategoryMuted: string;
  lightCategoryBorder: string;
  lightCategoryAction: string;
  lightCategoryIconBackground: string;
  lightCategoryIconText: string;
  darkToolBackground: string;
  darkToolText: string;
  darkToolMuted: string;
  darkToolBorder: string;
  darkToolAction: string;
  darkToolIconBackground: string;
  darkToolIconText: string;
  darkCategoryBackground: string;
  darkCategoryText: string;
  darkCategoryMuted: string;
  darkCategoryBorder: string;
  darkCategoryAction: string;
  darkCategoryIconBackground: string;
  darkCategoryIconText: string;
}

export interface NavigationLink {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  sortOrder: number;
}

export interface HeaderSettings {
  showSearch: boolean;
  showThemeToggle: boolean;
  lightBackground: string;
  lightText: string;
  lightLink: string;
  lightHover: string;
  lightBorder: string;
  darkBackground: string;
  darkText: string;
  darkLink: string;
  darkHover: string;
  darkBorder: string;
  links: NavigationLink[];
}

export interface FooterColumnSettings {
  id: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  links: NavigationLink[];
}

export interface FooterSettings {
  description: string;
  copyrightText: string;
  bottomNote: string;
  showAdminLink: boolean;
  lightBackground: string;
  lightText: string;
  lightHeading: string;
  lightLink: string;
  lightBorder: string;
  darkBackground: string;
  darkText: string;
  darkHeading: string;
  darkLink: string;
  darkBorder: string;
  columns: FooterColumnSettings[];
}

export interface StaticPage extends SeoFields {
  id: string;
  slug: string;
  title: string;
  navigationLabel: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'hidden';
  showInHeader: boolean;
  showInFooter: boolean;
  footerGroup: 'company' | 'resources' | 'legal';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
}

export interface BlogPost extends SeoFields {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentFormat?: 'html' | 'markdown';
  status: 'draft' | 'published';
  category: string;
  tags: string[];
  author: string;
  coverImage?: string;
  coverAlt?: string;
  faqs?: FaqItem[];
  publishedAt?: string;
  updatedAt: string;
}

export interface ToolOverride extends SeoFields {
  status?: 'active' | 'disabled' | 'maintenance' | 'coming-soon';
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  featured?: boolean;
  popular?: boolean;
  maintenanceMessage?: string;
  maximumFileSize?: number;
  privacyMessage?: string;
  howToHtml?: string;
  featuresHtml?: string;
  limitationsHtml?: string;
  faqs?: FaqItem[];
  cardButtonText?: string;
  cardButtonColor?: string;
  actionButtonText?: string;
  actionButtonColor?: string;
  resetButtonText?: string;
  processingButtonText?: string;
  resultTitle?: string;
  resultEmptyText?: string;
  resultSuccessText?: string;
}

export interface ThemeSettings {
  lightBackground: string;
  lightSurface: string;
  lightSurfaceSecondary: string;
  lightText: string;
  lightTextSecondary: string;
  lightMuted: string;
  lightBorder: string;
  lightPrimary: string;
  lightSecondary: string;
  lightAccent: string;
  darkBackground: string;
  darkSurface: string;
  darkSurfaceSecondary: string;
  darkText: string;
  darkTextSecondary: string;
  darkMuted: string;
  darkBorder: string;
  darkPrimary: string;
  darkSecondary: string;
  darkAccent: string;
  cardRadius: number;
}

export type HomeSectionId = 'hero' | 'stats' | 'popular' | 'why' | 'categories' | 'privacy' | 'how' | 'blog' | 'faq';

export interface HomeFeatureItem {
  title: string;
  description: string;
}

export interface HomeStepItem {
  number: string;
  title: string;
  description: string;
}

export interface HomeCategoryCard {
  slug: string;
  title: string;
  description: string;
  buttonText: string;
  visible: boolean;
  sortOrder: number;
}

export interface HomeSettings extends SeoFields {
  heroBadge: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  heroShowVisual: boolean;
  heroShowActiveToolCount: boolean;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  stats: Array<{ label: string; value: string }>;
  popularTitle: string;
  popularDescription: string;
  popularViewAllText: string;
  popularViewAllUrl: string;
  popularLimit: number;
  whyTitle: string;
  whyDescription: string;
  whyItems: HomeFeatureItem[];
  categoriesTitle: string;
  categoriesDescription: string;
  categoryCards: HomeCategoryCard[];
  privacyBadge: string;
  privacyTitle: string;
  privacyDescription: string;
  privacyItems: string[];
  howTitle: string;
  howDescription: string;
  howSteps: HomeStepItem[];
  blogTitle: string;
  blogDescription: string;
  blogViewAllText: string;
  blogViewAllUrl: string;
  blogLimit: number;
  faqTitle: string;
  faqDescription: string;
  faqs: FaqItem[];
  sectionVisibility: Record<HomeSectionId, boolean>;
  sectionOrder: HomeSectionId[];
}

export interface GlobalSeoSettings {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  metaKeywords: string;
  defaultOgImage: string;
  ogSiteName: string;
  twitterSite: string;
  twitterCreator: string;
  twitterCard: 'summary' | 'summary_large_image';
  organizationName: string;
  organizationLogo: string;
  organizationSchemaJson: string;
  googleVerification: string;
  bingVerification: string;
  defaultRobotsIndex: boolean;
  defaultRobotsFollow: boolean;
}

export interface SitemapUrl {
  loc: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SitemapSettings {
  enabled: boolean;
  includeHome: boolean;
  includeCategories: boolean;
  includeTools: boolean;
  includeBlog: boolean;
  includeStaticPages: boolean;
  toolChangefreq: SitemapUrl['changefreq'];
  blogChangefreq: SitemapUrl['changefreq'];
  toolPriority: number;
  blogPriority: number;
  customUrls: SitemapUrl[];
  excludedPaths: string[];
}

export interface ErrorReport {
  id: string;
  toolSlug: string;
  message: string;
  stage?: string;
  browser?: string;
  createdAt: string;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  notes?: string;
}

export interface FeedbackItem {
  id: string;
  toolSlug: string;
  worked: boolean;
  rating?: number;
  message?: string;
  createdAt: string;
  status: 'new' | 'reviewed' | 'archived';
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  type: 'page_view' | 'tool_open' | 'tool_action' | 'download' | 'click';
  path: string;
  toolSlug?: string;
  action?: string;
  label?: string;
  referrer?: string;
  userAgent?: string;
  createdAt: string;
}

export interface SiteSettings extends Record<string, unknown> {
  siteName: string;
  tagline: string;
  announcement: string;
  announcementEnabled: boolean;
  contactEmail: string;
  canonicalDomain: string;
  theme: ThemeSettings;
  cardAppearance: CardAppearanceSettings;
  header: HeaderSettings;
  footer: FooterSettings;
  home: HomeSettings;
  seo: GlobalSeoSettings;
  sitemap: SitemapSettings;
  pageSeo: Record<string, SeoFields>;
  robotsTxt: string;
  htaccess: string;
}

export interface SiteStore {
  toolOverrides: Record<string, ToolOverride>;
  posts: BlogPost[];
  pages: StaticPage[];
  deletedPageSlugs: string[];
  settings: SiteSettings;
  errors: ErrorReport[];
  feedback: FeedbackItem[];
  analytics: AnalyticsEvent[];
  activity: Array<{ id: string; action: string; target?: string; createdAt: string }>;
}

export const defaultTheme: ThemeSettings = {
  lightBackground: '#f7f8ff',
  lightSurface: '#ffffff',
  lightSurfaceSecondary: '#f1f5ff',
  lightText: '#0f172a',
  lightTextSecondary: '#334155',
  lightMuted: '#64748b',
  lightBorder: '#dbe4f2',
  lightPrimary: '#6366f1',
  lightSecondary: '#3882f6',
  lightAccent: '#06b6d4',
  darkBackground: '#06101e',
  darkSurface: '#0d1b2e',
  darkSurfaceSecondary: '#14243b',
  darkText: '#f8fbff',
  darkTextSecondary: '#cbd5e1',
  darkMuted: '#94a3b8',
  darkBorder: '#263a57',
  darkPrimary: '#8b5cf6',
  darkSecondary: '#3882f6',
  darkAccent: '#06b6d4',
  cardRadius: 18,
};

export const defaultCardAppearance: CardAppearanceSettings = {
  lightToolBackground: '#ffffff',
  lightToolText: '#0f172a',
  lightToolMuted: '#64748b',
  lightToolBorder: '#dbe4f2',
  lightToolAction: '#5b5cf0',
  lightToolIconBackground: '#eef2ff',
  lightToolIconText: '#6366f1',
  lightCategoryBackground: '#ffffff',
  lightCategoryText: '#0f172a',
  lightCategoryMuted: '#64748b',
  lightCategoryBorder: '#dbe4f2',
  lightCategoryAction: '#5b5cf0',
  lightCategoryIconBackground: '#eef2ff',
  lightCategoryIconText: '#6366f1',
  darkToolBackground: '#0d1b2e',
  darkToolText: '#f8fbff',
  darkToolMuted: '#94a3b8',
  darkToolBorder: '#263a57',
  darkToolAction: '#9b8cff',
  darkToolIconBackground: '#182747',
  darkToolIconText: '#9b8cff',
  darkCategoryBackground: '#0d1b2e',
  darkCategoryText: '#f8fbff',
  darkCategoryMuted: '#94a3b8',
  darkCategoryBorder: '#263a57',
  darkCategoryAction: '#9b8cff',
  darkCategoryIconBackground: '#182747',
  darkCategoryIconText: '#9b8cff',
};

export const defaultStaticPages: StaticPage[] = [
  {
    id: 'page_about_us', slug: 'about-us', title: 'About Us', navigationLabel: 'About Us',
    excerpt: 'Learn more about Dotvec Tools and our mission.',
    content: '<h2>About Dotvec Tools</h2><p>Dotvec Tools provides practical online utilities for files, documents, media, SEO and everyday digital work.</p><h2>Our mission</h2><p>Our goal is to make useful tools simple, private and accessible.</p>',
    status: 'published', showInHeader: false, showInFooter: true, footerGroup: 'company', sortOrder: 10, isSystem: true,
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    seoTitle: 'About Us | Dotvec Tools', metaDescription: 'Learn more about Dotvec Tools, our mission and our free online utilities.',
    metaKeywords: 'about dotvec tools, free online tools', robotsIndex: true, robotsFollow: true, openGraphType: 'website', twitterCard: 'summary_large_image',
  },
  {
    id: 'page_contact', slug: 'contact', title: 'Contact', navigationLabel: 'Contact',
    excerpt: 'Contact Dotvec Tools for support or business inquiries.',
    content: '<h2>Contact Dotvec Tools</h2><p>For support or business inquiries, contact <a href="mailto:dotvecofficial@gmail.com">dotvecofficial@gmail.com</a>.</p>',
    status: 'published', showInHeader: false, showInFooter: true, footerGroup: 'company', sortOrder: 20, isSystem: true,
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    seoTitle: 'Contact | Dotvec Tools', metaDescription: 'Contact Dotvec Tools for support or business inquiries.', metaKeywords: 'contact dotvec tools, support',
    robotsIndex: true, robotsFollow: true, openGraphType: 'website', twitterCard: 'summary_large_image',
  },
  {
    id: 'page_privacy', slug: 'privacy-policy', title: 'Privacy Policy', navigationLabel: 'Privacy',
    excerpt: 'Read how Dotvec Tools handles browser and VPS file processing.',
    content: '<h2>Privacy Policy</h2><p>Supported browser tools process files locally and do not upload them. VPS tools are clearly labeled and use temporary processing storage with cleanup.</p><p>Technical analytics do not include uploaded file contents.</p>',
    status: 'published', showInHeader: false, showInFooter: true, footerGroup: 'legal', sortOrder: 10, isSystem: true,
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    seoTitle: 'Privacy Policy | Dotvec Tools', metaDescription: 'Read how Dotvec Tools handles browser and VPS file processing.', metaKeywords: 'privacy policy, browser processing, file privacy',
    robotsIndex: true, robotsFollow: true, openGraphType: 'website', twitterCard: 'summary_large_image',
  },
  {
    id: 'page_terms', slug: 'terms', title: 'Terms of Use', navigationLabel: 'Terms',
    excerpt: 'Terms for using Dotvec Tools and its online utilities.',
    content: '<h2>Terms of Use</h2><p>Use the tools lawfully and verify important output before relying on it. You are responsible for files and content you process.</p>',
    status: 'published', showInHeader: false, showInFooter: true, footerGroup: 'legal', sortOrder: 20, isSystem: true,
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    seoTitle: 'Terms of Use | Dotvec Tools', metaDescription: 'Terms for using Dotvec Tools and its online utilities.', metaKeywords: 'terms of use, dotvec tools terms',
    robotsIndex: true, robotsFollow: true, openGraphType: 'website', twitterCard: 'summary_large_image',
  },
  {
    id: 'page_disclaimer', slug: 'disclaimer', title: 'Disclaimer', navigationLabel: 'Disclaimer',
    excerpt: 'Important limitations and information about Dotvec Tools results.',
    content: '<h2>Disclaimer</h2><p>Dotvec Tools is provided as a utility platform. Results may vary by browser, file format and device. Financial and health calculators are informational only.</p>',
    status: 'published', showInHeader: false, showInFooter: true, footerGroup: 'legal', sortOrder: 30, isSystem: true,
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
    seoTitle: 'Disclaimer | Dotvec Tools', metaDescription: 'Important limitations and information about Dotvec Tools results.', metaKeywords: 'disclaimer, online tools limitations',
    robotsIndex: true, robotsFollow: true, openGraphType: 'website', twitterCard: 'summary_large_image',
  },
];

export const defaultHeader: HeaderSettings = {
  showSearch: true,
  showThemeToggle: true,
  lightBackground: '#f7f8ff',
  lightText: '#0f172a',
  lightLink: '#334155',
  lightHover: '#eef2ff',
  lightBorder: '#dbe4f2',
  darkBackground: '#06101e',
  darkText: '#f8fbff',
  darkLink: '#cbd5e1',
  darkHover: '#14243b',
  darkBorder: '#263a57',
  links: [
    { id: 'nav_all', label: 'All Tools', href: '/all-tools', visible: true, sortOrder: 10 },
    { id: 'nav_image', label: 'Image', href: '/image-tools', visible: true, sortOrder: 20 },
    { id: 'nav_pdf', label: 'PDF', href: '/pdf-tools', visible: true, sortOrder: 30 },
    { id: 'nav_video', label: 'Video', href: '/video-tools', visible: true, sortOrder: 40 },
    { id: 'nav_audio', label: 'Audio', href: '/audio-tools', visible: true, sortOrder: 50 },
    { id: 'nav_social', label: 'Social', href: '/social-downloaders', visible: true, sortOrder: 60 },
    { id: 'nav_documents', label: 'Documents', href: '/document-tools', visible: true, sortOrder: 70 },
    { id: 'nav_developer', label: 'Developer', href: '/developer-tools', visible: true, sortOrder: 80 },
    { id: 'nav_seo', label: 'SEO', href: '/seo-tools', visible: true, sortOrder: 90 },
    { id: 'nav_calculators', label: 'Calculators', href: '/calculators', visible: true, sortOrder: 100 },
    { id: 'nav_blog', label: 'Blog', href: '/blog', visible: true, sortOrder: 110 },
  ],
};

export const defaultFooter: FooterSettings = {
  description: 'Free browser utilities plus self-hosted VPS tools for PDF, media, documents, SEO and public social downloads.',
  copyrightText: '© {year} Dotvec Tools.',
  bottomNote: 'Use downloaders only for media you own or have permission to save.',
  showAdminLink: true,
  lightBackground: '#0b1020',
  lightText: '#94a3b8',
  lightHeading: '#ffffff',
  lightLink: '#94a3b8',
  lightBorder: '#25304a',
  darkBackground: '#050914',
  darkText: '#94a3b8',
  darkHeading: '#ffffff',
  darkLink: '#a8b7cf',
  darkBorder: '#1e2c43',
  columns: [
    { id: 'file-tools', title: 'File tools', visible: true, sortOrder: 10, links: [
      { id: 'foot_image', label: 'Image Tools', href: '/image-tools', visible: true, sortOrder: 10 },
      { id: 'foot_pdf', label: 'PDF Tools', href: '/pdf-tools', visible: true, sortOrder: 20 },
      { id: 'foot_video', label: 'Video Tools', href: '/video-tools', visible: true, sortOrder: 30 },
      { id: 'foot_audio', label: 'Audio Tools', href: '/audio-tools', visible: true, sortOrder: 40 },
      { id: 'foot_document', label: 'Document Tools', href: '/document-tools', visible: true, sortOrder: 50 },
    ] },
    { id: 'resources', title: 'Online tools', visible: true, sortOrder: 20, links: [
      { id: 'foot_social', label: 'Social Downloaders', href: '/social-downloaders', visible: true, sortOrder: 10 },
      { id: 'foot_developer', label: 'Developer Tools', href: '/developer-tools', visible: true, sortOrder: 20 },
      { id: 'foot_seo', label: 'SEO Tools', href: '/seo-tools', visible: true, sortOrder: 30 },
      { id: 'foot_calc', label: 'Calculators', href: '/calculators', visible: true, sortOrder: 40 },
      { id: 'foot_all', label: 'All Tools', href: '/all-tools', visible: true, sortOrder: 50 },
    ] },
    { id: 'company', title: 'Company', visible: true, sortOrder: 30, links: [
      { id: 'foot_blog', label: 'Blog', href: '/blog', visible: true, sortOrder: 10 },
    ] },
    { id: 'legal', title: 'Legal', visible: true, sortOrder: 40, links: [] },
  ],
};

export const defaultHome: HomeSettings = {
  heroBadge: '100% Free • No Sign Up • No Limits',
  heroTitle: 'All-in-one Online Tools',
  heroAccent: 'For Everyday Tasks',
  heroDescription: 'Powerful tools for images, PDF, video, audio, social media, SEO and more. Fast, secure and simple to use.',
  heroShowVisual: true,
  heroShowActiveToolCount: true,
  primaryButtonText: 'Explore All Tools',
  primaryButtonUrl: '/all-tools',
  secondaryButtonText: 'How It Works',
  secondaryButtonUrl: '#how-it-works',
  stats: [
    { value: '200+', label: 'Powerful Tools' },
    { value: '50M+', label: 'Files Processed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '100%', label: 'Free Forever' },
  ],
  popularTitle: 'Most Popular Tools',
  popularDescription: 'Hand-picked tools our users use the most.',
  popularViewAllText: 'View all tools',
  popularViewAllUrl: '/all-tools',
  popularLimit: 8,
  whyTitle: 'Why Choose Dotvec Tools?',
  whyDescription: 'We make online tools simple, powerful and accessible for everyone.',
  whyItems: [
    { title: 'Fast & Secure', description: 'Modern processing with privacy-conscious workflows.' },
    { title: 'No Installation', description: 'Use every tool directly in your browser or VPS.' },
    { title: 'Works Everywhere', description: 'Use on desktop, tablet and modern mobile browsers.' },
    { title: 'Always Free', description: 'Public tools stay free without accounts or subscriptions.' },
  ],
  categoriesTitle: 'Everything organized by category',
  categoriesDescription: 'A single professional platform for everyday file, content and development work.',
  categoryCards: [
    { slug: 'image', title: 'Image Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 10 },
    { slug: 'pdf', title: 'PDF Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 20 },
    { slug: 'text', title: 'Text Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 30 },
    { slug: 'developer', title: 'Developer Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 40 },
    { slug: 'seo', title: 'SEO Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 50 },
    { slug: 'calculator', title: 'Calculators', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 60 },
    { slug: 'ocr', title: 'OCR Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 70 },
    { slug: 'video', title: 'Video Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 80 },
    { slug: 'audio', title: 'Audio Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 90 },
    { slug: 'document', title: 'Document Tools', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 100 },
    { slug: 'social', title: 'Social Downloaders', description: '{count} available tools', buttonText: 'Explore category', visible: true, sortOrder: 110 },
  ],
  privacyBadge: 'Privacy first',
  privacyTitle: 'Your files remain on your device',
  privacyDescription: 'Browser-based tools do not send your files to our server. Heavy tools are clearly separated before upload begins.',
  privacyItems: [
    'No hidden file uploads',
    'No public account required',
    'Temporary memory is cleared after reset',
    'Heavy server tools use automatic cleanup',
  ],
  howTitle: 'How it works',
  howDescription: 'Complete common tasks in three simple steps.',
  howSteps: [
    { number: '1', title: 'Choose a tool', description: 'Search or browse a category.' },
    { number: '2', title: 'Add your content', description: 'Select a file or paste text.' },
    { number: '3', title: 'Process and download', description: 'Review the result and save it.' },
  ],
  blogTitle: 'Latest from the blog',
  blogDescription: 'Guides for privacy, file optimization and SEO workflows.',
  blogViewAllText: 'View all posts',
  blogViewAllUrl: '/blog',
  blogLimit: 3,
  faqTitle: 'Frequently asked questions',
  faqDescription: 'Answers to common questions about Dotvec Tools.',
  faqs: [
    { question: 'Is Dotvec Tools free?', answer: 'Yes. Public tools do not require a subscription.' },
    { question: 'Do I need an account?', answer: 'No public account is required.' },
    { question: 'Are browser-tool files uploaded?', answer: 'No. Browser tools process supported files locally.' },
    { question: 'Why can large files be slower?', answer: 'Local processing depends on your device memory and CPU.' },
  ],
  sectionVisibility: { hero: true, stats: true, popular: true, why: true, categories: true, privacy: true, how: true, blog: true, faq: true },
  sectionOrder: ['hero', 'stats', 'popular', 'why', 'categories', 'privacy', 'how', 'blog', 'faq'],
  seoTitle: 'Dotvec Tools – Free Online Tools',
  metaDescription: 'Free browser-based image, PDF, text, developer, SEO and calculator tools.',
  metaKeywords: 'free online tools, pdf tools, image tools, seo tools, developer tools',
  robotsIndex: true,
  robotsFollow: true,
};

export const defaultSeo: GlobalSeoSettings = {
  defaultTitle: 'Dotvec Tools – Free Online Tools',
  titleTemplate: '%s | Dotvec Tools',
  defaultDescription: 'Free browser-based image, PDF, text, developer, SEO and calculator tools.',
  metaKeywords: 'free online tools, pdf tools, image tools, seo tools, developer tools',
  defaultOgImage: '',
  ogSiteName: 'Dotvec Tools',
  twitterSite: '@dotvecofficial',
  twitterCreator: '@dotvecofficial',
  twitterCard: 'summary_large_image',
  organizationName: 'Dotvec Tools',
  organizationLogo: '',
  organizationSchemaJson: '',
  googleVerification: '',
  bingVerification: '',
  defaultRobotsIndex: true,
  defaultRobotsFollow: true,
};

export const defaultSitemap: SitemapSettings = {
  enabled: true,
  includeHome: true,
  includeCategories: true,
  includeTools: true,
  includeBlog: true,
  includeStaticPages: true,
  toolChangefreq: 'monthly',
  blogChangefreq: 'weekly',
  toolPriority: 0.8,
  blogPriority: 0.7,
  customUrls: [],
  excludedPaths: ['/admin', '/api'],
};

const defaultSettings: SiteSettings = {
  siteName: 'Dotvec Tools',
  tagline: 'Free tools that work in your browser',
  announcement: '100% free tools — no signup, no subscription and private browser processing.',
  announcementEnabled: true,
  contactEmail: 'dotvecofficial@gmail.com',
  canonicalDomain: 'http://localhost:3000',
  theme: defaultTheme,
  cardAppearance: defaultCardAppearance,
  header: defaultHeader,
  footer: defaultFooter,
  home: defaultHome,
  seo: defaultSeo,
  sitemap: defaultSitemap,
  pageSeo: {},
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: {{DOMAIN}}/sitemap.xml',
  htaccess: '# Apache only. Next.js VPS deployments normally use Nginx or a Node reverse proxy.\nRewriteEngine On\nRewriteCond %{HTTPS} !=on\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
};

const dataFile = path.join(process.cwd(), 'data', 'store.json');
const backupFile = path.join(process.cwd(), 'data', 'store.backup.json');
let storeQueue: Promise<unknown> = Promise.resolve();

function normalizeSeoFields<T extends SeoFields>(value: T): T {
  return {
    ...value,
    metaKeywords: value.metaKeywords || '',
    canonicalUrl: value.canonicalUrl || '',
    openGraphTitle: value.openGraphTitle || '',
    openGraphDescription: value.openGraphDescription || '',
    openGraphImage: value.openGraphImage || '',
    openGraphType: value.openGraphType || 'website',
    twitterCard: value.twitterCard || 'summary_large_image',
    twitterTitle: value.twitterTitle || '',
    twitterDescription: value.twitterDescription || '',
    twitterImage: value.twitterImage || '',
    robotsIndex: value.robotsIndex ?? true,
    robotsFollow: value.robotsFollow ?? true,
    schemaJson: value.schemaJson || '',
  };
}

function normalizeStore(input: Partial<SiteStore>): SiteStore {
  const rawSettings = (input.settings || {}) as Partial<SiteSettings>;
  const settings = { ...defaultSettings, ...rawSettings } as SiteSettings;
  settings.theme = { ...defaultTheme, ...(rawSettings.theme || {}) };
  settings.cardAppearance = { ...defaultCardAppearance, ...(rawSettings.cardAppearance || {}) };
  settings.header = { ...defaultHeader, ...(rawSettings.header || {}) };
  settings.header.links = Array.isArray(settings.header.links) ? settings.header.links : defaultHeader.links;
  settings.footer = { ...defaultFooter, ...(rawSettings.footer || {}) };
  settings.footer.columns = Array.isArray(settings.footer.columns) ? settings.footer.columns : defaultFooter.columns;
  settings.home = normalizeSeoFields({ ...defaultHome, ...(rawSettings.home || {}) });
  settings.home.stats = Array.isArray(settings.home.stats) ? settings.home.stats : defaultHome.stats;
  settings.home.faqs = Array.isArray(settings.home.faqs) ? settings.home.faqs : defaultHome.faqs;
  settings.home.whyItems = Array.isArray(settings.home.whyItems) ? settings.home.whyItems : defaultHome.whyItems;
  settings.home.categoryCards = Array.isArray(settings.home.categoryCards) ? settings.home.categoryCards : defaultHome.categoryCards;
  settings.home.privacyItems = Array.isArray(settings.home.privacyItems) ? settings.home.privacyItems : defaultHome.privacyItems;
  settings.home.howSteps = Array.isArray(settings.home.howSteps) ? settings.home.howSteps : defaultHome.howSteps;
  settings.home.sectionOrder = Array.isArray(settings.home.sectionOrder) ? settings.home.sectionOrder : defaultHome.sectionOrder;
  settings.home.sectionVisibility = { ...defaultHome.sectionVisibility, ...(settings.home.sectionVisibility || {}) };
  settings.home.popularLimit = Math.max(1, Math.min(24, Number(settings.home.popularLimit) || defaultHome.popularLimit));
  settings.home.blogLimit = Math.max(1, Math.min(12, Number(settings.home.blogLimit) || defaultHome.blogLimit));
  settings.seo = { ...defaultSeo, ...(rawSettings.seo || {}) };
  settings.sitemap = { ...defaultSitemap, ...(rawSettings.sitemap || {}) };
  settings.pageSeo = rawSettings.pageSeo || {};
  settings.sitemap.customUrls = Array.isArray(settings.sitemap.customUrls) ? settings.sitemap.customUrls : [];
  settings.sitemap.excludedPaths = Array.isArray(settings.sitemap.excludedPaths) ? settings.sitemap.excludedPaths : [];

  return {
    toolOverrides: input.toolOverrides || {},
    posts: (input.posts || []).map((post) => normalizeSeoFields({ ...post, tags: post.tags || [], faqs: post.faqs || [] })) as BlogPost[],
    pages: (() => {
      const deleted = new Set(input.deletedPageSlugs || []);
      const current = [...(input.pages || [])];
      for (const page of defaultStaticPages) {
        if (!deleted.has(page.slug) && !current.some((item) => item.id === page.id || item.slug === page.slug)) current.push(page);
      }
      return current.map((page) => normalizeSeoFields({
        ...page,
        navigationLabel: page.navigationLabel || page.title,
        status: page.status || 'draft',
        showInHeader: Boolean(page.showInHeader),
        showInFooter: Boolean(page.showInFooter),
        footerGroup: page.footerGroup || 'company',
        sortOrder: Number(page.sortOrder) || 0,
        isSystem: Boolean(page.isSystem || defaultStaticPages.some((item) => item.slug === page.slug)),
      })) as StaticPage[];
    })(),
    deletedPageSlugs: input.deletedPageSlugs || [],
    settings,
    errors: input.errors || [],
    feedback: input.feedback || [],
    analytics: input.analytics || [],
    activity: input.activity || [],
  };
}

async function readStoreFile(): Promise<SiteStore> {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<SiteStore>);
  } catch (primaryError) {
    try {
      const backupRaw = await fs.readFile(backupFile, 'utf8');
      const recovered = normalizeStore(JSON.parse(backupRaw) as Partial<SiteStore>);
      await writeStoreFile(recovered);
      return recovered;
    } catch {
      const fresh = normalizeStore({});
      await writeStoreFile(fresh);
      return fresh;
    }
  }
}

async function writeStoreFile(next: SiteStore): Promise<void> {
  const directory = path.dirname(dataFile);
  const serialized = JSON.stringify(normalizeStore(next), null, 2);
  const temp = path.join(directory, `store.${process.pid}.${Date.now()}.tmp`);

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temp, serialized, 'utf8');

  // Keep a last-known-good copy. This also makes recovery possible if Windows
  // or antivirus software interrupts replacement of store.json.
  try {
    await fs.copyFile(dataFile, backupFile);
  } catch {
    // The primary file may not exist on first run.
  }

  // Windows does not reliably allow rename() over an existing destination.
  // Removing the old destination first prevents EPERM/EEXIST and empty API responses.
  try {
    await fs.rm(dataFile, { force: true });
    await fs.rename(temp, dataFile);
  } catch (error) {
    try {
      await fs.copyFile(temp, dataFile);
      await fs.rm(temp, { force: true });
    } catch {
      await fs.rm(temp, { force: true }).catch(() => undefined);
      throw error;
    }
  }
}

export async function readStore(): Promise<SiteStore> {
  return readStoreFile();
}

export async function writeStore(next: SiteStore): Promise<void> {
  const operation = storeQueue
    .catch(() => undefined)
    .then(() => writeStoreFile(next));
  storeQueue = operation;
  await operation;
}

export async function mutateStore<T>(mutator: (store: SiteStore) => T | Promise<T>): Promise<T> {
  let result!: T;
  const operation = storeQueue
    .catch(() => undefined)
    .then(async () => {
      const store = await readStoreFile();
      result = await mutator(store);
      await writeStoreFile(store);
    });

  storeQueue = operation;
  await operation;
  return result;
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
