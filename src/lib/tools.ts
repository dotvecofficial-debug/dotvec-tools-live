export type ToolStatus = 'active' | 'disabled' | 'maintenance' | 'coming-soon';
export type ToolCategory =
  | 'image'
  | 'pdf'
  | 'text'
  | 'developer'
  | 'seo'
  | 'calculator'
  | 'ocr'
  | 'video'
  | 'audio'
  | 'document'
  | 'social'
  | 'backend';

export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: ToolCategory;
  categoryLabel: string;
  keywords: string[];
  alternativeNames: string[];
  status: ToolStatus;
  featured: boolean;
  popular: boolean;
  processingMode: 'browser' | 'server';
  acceptedFormats: string[];
  maximumFileSize: number;
  supportsMultipleFiles: boolean;
  relatedToolIds: string[];
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  defaultFaqs: { question: string; answer: string }[];
  privacyMessage: string;
  version: string;
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
  maintenanceMessage?: string;
  howToHtml?: string;
  featuresHtml?: string;
  limitationsHtml?: string;
  faqs?: { question: string; answer: string }[];
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

type ToolSpec = {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  mode?: 'browser' | 'server';
  popular?: boolean;
  featured?: boolean;
  multiple?: boolean;
  maxMB?: number;
  formats?: string[];
  alternativeNames?: string[];
  status?: ToolStatus;
};

const labels: Record<ToolCategory, string> = {
  image: 'Image Tools',
  pdf: 'PDF Tools',
  text: 'Text Tools',
  developer: 'Developer Tools',
  seo: 'SEO Tools',
  calculator: 'Calculators',
  ocr: 'OCR Tools',
  video: 'Video Tools',
  audio: 'Audio Tools',
  document: 'Document Tools',
  social: 'Social Downloaders',
  backend: 'Server Tools',
};

const browserPrivacy = 'Your files are processed locally in your browser and are never uploaded to our servers.';
const serverPrivacy = 'Files are uploaded temporarily to your VPS for processing and are deleted automatically after the result is prepared.';

function words(value: string): string[] {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean))];
}

function makeTool(spec: ToolSpec): ToolDefinition {
  const mode = spec.mode ?? 'browser';
  const maxMB = spec.maxMB ?? (mode === 'server' ? 500 : spec.category === 'image' ? 30 : 75);
  return {
    id: spec.slug,
    slug: spec.slug,
    title: spec.title,
    shortDescription: spec.description,
    fullDescription: spec.description,
    category: spec.category,
    categoryLabel: labels[spec.category],
    keywords: [...words(`${spec.title} ${spec.description} ${labels[spec.category]}`), 'free', 'online', mode === 'server' ? 'vps' : 'browser'],
    alternativeNames: spec.alternativeNames ?? [],
    status: spec.status ?? 'active',
    featured: spec.featured ?? false,
    popular: spec.popular ?? false,
    processingMode: mode,
    acceptedFormats: spec.formats ?? [],
    maximumFileSize: maxMB,
    supportsMultipleFiles: spec.multiple ?? false,
    relatedToolIds: [],
    defaultSeoTitle: `${spec.title} – Free Online Tool | Dotvec Tools`,
    defaultMetaDescription: `${spec.description} No signup or paid external API is required.`,
    metaKeywords: words(`${spec.title} ${spec.description}`).join(', '),
    robotsIndex: true,
    robotsFollow: true,
    openGraphType: 'website',
    twitterCard: 'summary_large_image',
    defaultFaqs: [],
    privacyMessage: mode === 'server' ? serverPrivacy : browserPrivacy,
    version: '2.2.0',
    cardButtonText: 'Get Started',
    resetButtonText: 'Reset',
    processingButtonText: '',
    resultTitle: '',
    resultEmptyText: '',
    resultSuccessText: '',
  };
}

const specs: ToolSpec[] = [
  // Image tools — browser based
  { slug: 'image-compressor', title: 'Image Compressor', description: 'Compress JPG, PNG and WebP images locally.', category: 'image', popular: true, featured: true },
  { slug: 'image-resizer', title: 'Image Resizer', description: 'Resize image dimensions while preserving aspect ratio.', category: 'image', popular: true },
  { slug: 'image-cropper', title: 'Image Cropper', description: 'Crop images with coordinates and common aspect presets.', category: 'image' },
  { slug: 'image-converter', title: 'Image Converter', description: 'Convert images between JPG, PNG and WebP.', category: 'image' },
  { slug: 'image-rotator', title: 'Image Rotator', description: 'Rotate images left, right or by a custom angle.', category: 'image' },
  { slug: 'image-flipper', title: 'Image Flipper', description: 'Flip images horizontally or vertically.', category: 'image' },
  { slug: 'image-watermark', title: 'Image Watermark', description: 'Add a configurable text watermark to an image.', category: 'image' },
  { slug: 'add-text-to-image', title: 'Add Text to Image', description: 'Place styled text over an image.', category: 'image' },
  { slug: 'grayscale-image', title: 'Grayscale Image', description: 'Convert a color image to grayscale.', category: 'image' },
  { slug: 'blur-image', title: 'Blur Image', description: 'Apply an adjustable blur effect to an image.', category: 'image' },
  { slug: 'brightness-contrast', title: 'Brightness & Contrast', description: 'Adjust image brightness and contrast.', category: 'image' },
  { slug: 'image-color-palette', title: 'Image Color Palette', description: 'Extract a practical color palette from an image.', category: 'image' },
  { slug: 'image-color-picker', title: 'Image Color Picker', description: 'Pick colors from an uploaded image.', category: 'image' },
  { slug: 'image-to-base64', title: 'Image to Base64', description: 'Convert an image to a Base64 data URL.', category: 'image' },
  { slug: 'base64-to-image', title: 'Base64 to Image', description: 'Preview and download a Base64 encoded image.', category: 'image' },
  { slug: 'favicon-generator', title: 'Favicon Generator', description: 'Create common favicon sizes in a ZIP file.', category: 'image' },
  { slug: 'bulk-image-compressor', title: 'Bulk Image Compressor', description: 'Compress multiple images and download the results as ZIP.', category: 'image', multiple: true, popular: true },
  { slug: 'bulk-image-converter', title: 'Bulk Image Converter', description: 'Convert multiple images to JPG, PNG or WebP.', category: 'image', multiple: true },
  { slug: 'image-metadata-remover', title: 'Image Metadata Remover', description: 'Re-encode an image to remove common EXIF metadata.', category: 'image' },
  { slug: 'social-media-image-resizer', title: 'Social Media Image Resizer', description: 'Resize images to common post, story and thumbnail dimensions.', category: 'image' },
  { slug: 'passport-photo-maker', title: 'Passport Photo Maker', description: 'Create a printable passport-photo sheet from one portrait.', category: 'image' },
  { slug: 'rounded-corners-image', title: 'Rounded Corners Image', description: 'Apply adjustable rounded corners to an image.', category: 'image' },
  { slug: 'add-border-to-image', title: 'Add Border to Image', description: 'Add a configurable border around an image.', category: 'image' },
  { slug: 'image-splitter', title: 'Image Splitter', description: 'Split an image into an adjustable grid and download a ZIP.', category: 'image' },
  { slug: 'meme-generator', title: 'Meme Generator', description: 'Add top and bottom meme text to an image.', category: 'image' },
  { slug: 'svg-to-png', title: 'SVG to PNG', description: 'Render an SVG file as a downloadable PNG.', category: 'image', formats: ['image/svg+xml'] },

  // PDF tools — browser based
  { slug: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDF files in a chosen order.', category: 'pdf', multiple: true, popular: true, featured: true },
  { slug: 'split-pdf', title: 'Split PDF', description: 'Split selected PDF pages into separate files.', category: 'pdf', popular: true },
  { slug: 'extract-pdf-pages', title: 'Extract PDF Pages', description: 'Create a new PDF from selected pages.', category: 'pdf' },
  { slug: 'remove-pdf-pages', title: 'Remove PDF Pages', description: 'Delete selected pages from a PDF.', category: 'pdf' },
  { slug: 'reorder-pdf-pages', title: 'Reorder PDF Pages', description: 'Create a PDF with pages in a new order.', category: 'pdf' },
  { slug: 'rotate-pdf-pages', title: 'Rotate PDF Pages', description: 'Rotate selected or all PDF pages.', category: 'pdf' },
  { slug: 'images-to-pdf', title: 'Images to PDF', description: 'Combine JPG and PNG images into a PDF.', category: 'pdf', multiple: true, alternativeNames: ['jpg to pdf', 'png to pdf'] },
  { slug: 'pdf-to-jpg', title: 'PDF to JPG', description: 'Render PDF pages as JPG images.', category: 'pdf', popular: true },
  { slug: 'pdf-to-png', title: 'PDF to PNG', description: 'Render PDF pages as PNG images.', category: 'pdf' },
  { slug: 'pdf-to-webp', title: 'PDF to WebP', description: 'Render PDF pages as WebP images.', category: 'pdf' },
  { slug: 'watermark-pdf', title: 'Add Watermark to PDF', description: 'Add a text watermark to selected PDF pages.', category: 'pdf' },
  { slug: 'page-numbers-pdf', title: 'Add Page Numbers to PDF', description: 'Add page numbers to a PDF.', category: 'pdf' },
  { slug: 'add-text-pdf', title: 'Add Text to PDF', description: 'Add a new text overlay to a PDF page.', category: 'pdf' },
  { slug: 'add-image-pdf', title: 'Add Image to PDF', description: 'Add an image overlay to a selected PDF page.', category: 'pdf' },
  { slug: 'pdf-metadata', title: 'PDF Metadata Editor', description: 'View and edit common PDF metadata.', category: 'pdf' },
  { slug: 'pdf-page-size', title: 'PDF Page Size Changer', description: 'Fit PDF pages onto A4, Letter or Legal paper.', category: 'pdf' },
  { slug: 'pdf-to-text', title: 'PDF to Text', description: 'Extract selectable text from PDF pages.', category: 'pdf' },
  { slug: 'text-to-pdf', title: 'Text to PDF', description: 'Create a PDF from plain text without uploading it.', category: 'pdf' },
  { slug: 'reverse-pdf-pages', title: 'Reverse PDF Pages', description: 'Reverse the order of all pages in a PDF.', category: 'pdf' },
  { slug: 'duplicate-pdf-pages', title: 'Duplicate PDF Pages', description: 'Duplicate selected pages inside a PDF.', category: 'pdf' },
  { slug: 'n-up-pdf', title: 'N-up PDF', description: 'Place two or four PDF pages on each output sheet.', category: 'pdf' },
  { slug: 'crop-pdf-pages', title: 'Crop PDF Pages', description: 'Crop PDF pages by configurable margins.', category: 'pdf' },
  { slug: 'sign-pdf', title: 'Sign PDF', description: 'Add a typed signature to a selected PDF page.', category: 'pdf' },
  { slug: 'flatten-pdf-forms', title: 'Flatten PDF Forms', description: 'Flatten form fields into regular PDF page content.', category: 'pdf' },

  // PDF tools — VPS binaries, no paid API
  { slug: 'real-pdf-compressor', title: 'Real PDF Compressor', description: 'Compress PDF content with Ghostscript quality presets.', category: 'pdf', mode: 'server', popular: true },
  { slug: 'repair-pdf', title: 'Repair PDF', description: 'Rebuild and linearize a damaged or inefficient PDF.', category: 'pdf', mode: 'server' },
  { slug: 'protect-pdf', title: 'Protect PDF', description: 'Encrypt a PDF with a password.', category: 'pdf', mode: 'server' },
  { slug: 'unlock-pdf', title: 'Unlock PDF', description: 'Remove a known password from a PDF.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-ocr', title: 'Scanned PDF OCR', description: 'Create a searchable text layer in a scanned PDF.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-to-pdfa', title: 'PDF to PDF/A', description: 'Convert a PDF to an archival PDF/A output.', category: 'pdf', mode: 'server' },
  { slug: 'grayscale-pdf', title: 'Grayscale PDF', description: 'Convert a PDF to grayscale for printing.', category: 'pdf', mode: 'server' },
  { slug: 'redact-pdf', title: 'Redact PDF', description: 'Permanently redact a rectangle on a selected PDF page.', category: 'pdf', mode: 'server' },
  { slug: 'compare-pdf', title: 'Compare PDF', description: 'Compare extracted text from two PDF files.', category: 'pdf', mode: 'server', multiple: true },
  { slug: 'extract-images-pdf', title: 'Extract Images from PDF', description: 'Extract embedded PDF images into a ZIP archive.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-to-html', title: 'PDF to HTML', description: 'Convert a PDF into an HTML document and assets ZIP.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-info', title: 'PDF Information', description: 'Inspect PDF page, size, version and metadata information.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-fonts-analyzer', title: 'PDF Fonts Analyzer', description: 'List fonts embedded or referenced by a PDF.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-to-word', title: 'PDF to Word', description: 'Create an editable DOCX from extracted PDF text.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-to-excel', title: 'PDF to Excel', description: 'Create an XLSX workbook from extracted PDF text lines.', category: 'pdf', mode: 'server' },
  { slug: 'pdf-to-powerpoint', title: 'PDF to PowerPoint', description: 'Create a PPTX with each PDF page as a slide image.', category: 'pdf', mode: 'server' },
  { slug: 'linearize-pdf', title: 'Linearize PDF', description: 'Optimize a PDF for fast web viewing.', category: 'pdf', mode: 'server' },
  { slug: 'high-quality-pdf-to-images', title: 'High Quality PDF to Images', description: 'Render PDF pages to high-resolution PNG files on the VPS.', category: 'pdf', mode: 'server' },

  // Text tools
  { slug: 'word-counter', title: 'Word Counter', description: 'Count words, sentences, paragraphs and reading time.', category: 'text', popular: true },
  { slug: 'character-counter', title: 'Character Counter', description: 'Count characters with and without spaces.', category: 'text' },
  { slug: 'case-converter', title: 'Case Converter', description: 'Convert text to uppercase, lowercase, title and sentence case.', category: 'text' },
  { slug: 'remove-duplicate-lines', title: 'Remove Duplicate Lines', description: 'Remove repeated lines while preserving order.', category: 'text' },
  { slug: 'remove-extra-spaces', title: 'Remove Extra Spaces', description: 'Clean repeated spaces and tabs.', category: 'text' },
  { slug: 'remove-line-breaks', title: 'Remove Line Breaks', description: 'Replace line breaks with a chosen separator.', category: 'text' },
  { slug: 'add-line-numbers', title: 'Add Line Numbers', description: 'Prefix every text line with a number.', category: 'text' },
  { slug: 'sort-lines', title: 'Sort Lines', description: 'Sort lines alphabetically or numerically.', category: 'text' },
  { slug: 'reverse-text', title: 'Reverse Text', description: 'Reverse characters, words or lines.', category: 'text' },
  { slug: 'find-replace', title: 'Find and Replace', description: 'Find and replace text with useful matching options.', category: 'text' },
  { slug: 'text-difference', title: 'Text Difference Checker', description: 'Compare two text blocks and highlight changes.', category: 'text' },
  { slug: 'keyword-density', title: 'Keyword Density Checker', description: 'Calculate word frequency and density.', category: 'text' },
  { slug: 'slug-generator', title: 'URL Slug Generator', description: 'Generate clean URL slugs from text.', category: 'text' },
  { slug: 'url-extractor', title: 'URL Extractor', description: 'Extract unique URLs from text.', category: 'text' },
  { slug: 'email-extractor', title: 'Email Extractor', description: 'Extract unique email addresses from text.', category: 'text' },
  { slug: 'text-to-speech', title: 'Text to Speech', description: 'Read text aloud using the browser speech engine.', category: 'text' },
  { slug: 'speech-to-text', title: 'Speech to Text', description: 'Transcribe microphone speech using supported browser features.', category: 'text' },
  { slug: 'lorem-ipsum-generator', title: 'Lorem Ipsum Generator', description: 'Generate placeholder paragraphs and sentences.', category: 'text' },
  { slug: 'text-repeater', title: 'Text Repeater', description: 'Repeat text a chosen number of times.', category: 'text' },
  { slug: 'extract-numbers', title: 'Number Extractor', description: 'Extract unique numbers from text.', category: 'text' },
  { slug: 'extract-hashtags', title: 'Hashtag Extractor', description: 'Extract unique hashtags from text.', category: 'text' },
  { slug: 'remove-duplicate-words', title: 'Remove Duplicate Words', description: 'Remove repeated words while preserving their first occurrence.', category: 'text' },
  { slug: 'markdown-to-html', title: 'Markdown to HTML', description: 'Convert basic Markdown syntax to safe HTML.', category: 'text' },
  { slug: 'html-to-text', title: 'HTML to Text', description: 'Remove HTML tags and extract readable text.', category: 'text' },
  { slug: 'random-string-generator', title: 'Random String Generator', description: 'Generate random text using secure browser randomness.', category: 'text' },

  // Developer tools
  { slug: 'json-formatter', title: 'JSON Formatter & Validator', description: 'Format, validate and sort JSON.', category: 'developer', popular: true },
  { slug: 'json-minifier', title: 'JSON Minifier', description: 'Minify valid JSON.', category: 'developer' },
  { slug: 'json-to-csv', title: 'JSON to CSV', description: 'Convert arrays of JSON objects to CSV.', category: 'developer' },
  { slug: 'csv-to-json', title: 'CSV to JSON', description: 'Convert CSV rows to JSON.', category: 'developer' },
  { slug: 'xml-formatter', title: 'XML Formatter', description: 'Format or minify XML.', category: 'developer' },
  { slug: 'xml-to-json', title: 'XML to JSON', description: 'Convert XML into JSON.', category: 'developer' },
  { slug: 'base64-tool', title: 'Base64 Encoder & Decoder', description: 'Encode or decode UTF-8 text with Base64.', category: 'developer' },
  { slug: 'url-encoder', title: 'URL Encoder & Decoder', description: 'Encode or decode URL components.', category: 'developer' },
  { slug: 'html-encoder', title: 'HTML Encoder & Decoder', description: 'Encode or decode HTML entities safely.', category: 'developer' },
  { slug: 'uuid-generator', title: 'UUID Generator', description: 'Generate one or many UUID values.', category: 'developer' },
  { slug: 'password-generator', title: 'Password Generator', description: 'Generate strong passwords locally.', category: 'developer' },
  { slug: 'hash-generator', title: 'Hash Generator', description: 'Generate SHA hashes with Web Crypto.', category: 'developer' },
  { slug: 'unix-timestamp', title: 'Unix Timestamp Converter', description: 'Convert dates and Unix timestamps.', category: 'developer' },
  { slug: 'regex-tester', title: 'Regex Tester', description: 'Test regular expressions against text.', category: 'developer' },
  { slug: 'qr-code-generator', title: 'QR Code Generator', description: 'Create downloadable QR codes.', category: 'developer', popular: true },
  { slug: 'jwt-decoder', title: 'JWT Decoder', description: 'Decode JWT header and payload without verifying a signature.', category: 'developer' },
  { slug: 'color-converter', title: 'Color Converter', description: 'Convert HEX, RGB and HSL colors.', category: 'developer' },
  { slug: 'html-minifier', title: 'HTML Minifier', description: 'Minify HTML source code.', category: 'developer' },
  { slug: 'css-minifier', title: 'CSS Minifier', description: 'Minify CSS source code.', category: 'developer' },
  { slug: 'javascript-minifier', title: 'JavaScript Minifier', description: 'Apply safe basic whitespace minification to JavaScript.', category: 'developer' },
  { slug: 'html-formatter', title: 'HTML Formatter', description: 'Apply readable indentation to HTML markup.', category: 'developer' },
  { slug: 'file-checksum', title: 'File Checksum Generator', description: 'Calculate SHA checksums for a local file.', category: 'developer' },
  { slug: 'cron-expression-generator', title: 'Cron Expression Generator', description: 'Build common five-field cron expressions.', category: 'developer' },

  // SEO generators and VPS analyzers
  { slug: 'meta-tags-generator', title: 'Meta Tags Generator', description: 'Generate standard HTML metadata.', category: 'seo' },
  { slug: 'open-graph-generator', title: 'Open Graph Generator', description: 'Generate Open Graph social metadata.', category: 'seo' },
  { slug: 'twitter-card-generator', title: 'Twitter Card Generator', description: 'Generate X and Twitter card metadata.', category: 'seo' },
  { slug: 'schema-generator', title: 'Schema Markup Generator', description: 'Generate structured JSON-LD markup.', category: 'seo', popular: true },
  { slug: 'robots-generator', title: 'Robots.txt Generator', description: 'Create robots.txt directives.', category: 'seo' },
  { slug: 'sitemap-generator', title: 'Sitemap XML Generator', description: 'Create a simple XML sitemap.', category: 'seo' },
  { slug: 'canonical-generator', title: 'Canonical Tag Generator', description: 'Generate a canonical link tag.', category: 'seo' },
  { slug: 'hreflang-generator', title: 'Hreflang Generator', description: 'Generate hreflang tags for language URLs.', category: 'seo' },
  { slug: 'serp-preview', title: 'SERP Preview', description: 'Preview a search result title and description.', category: 'seo' },
  { slug: 'utm-generator', title: 'UTM Link Generator', description: 'Build campaign tracking URLs.', category: 'seo' },
  { slug: 'website-seo-audit', title: 'Website SEO Audit', description: 'Audit important on-page SEO signals for a public URL.', category: 'seo', mode: 'server', popular: true },
  { slug: 'broken-link-checker', title: 'Broken Link Checker', description: 'Check page links and response statuses.', category: 'seo', mode: 'server' },
  { slug: 'website-meta-checker', title: 'Website Meta Checker', description: 'Inspect title, description, canonical and social tags.', category: 'seo', mode: 'server' },
  { slug: 'heading-checker', title: 'Website Heading Checker', description: 'Inspect H1 to H6 usage on a public page.', category: 'seo', mode: 'server' },
  { slug: 'image-alt-checker', title: 'Image Alt Text Checker', description: 'Find images with missing or empty alt attributes.', category: 'seo', mode: 'server' },
  { slug: 'redirect-checker', title: 'Redirect Checker', description: 'Follow and report an HTTP redirect chain.', category: 'seo', mode: 'server' },
  { slug: 'robots-checker', title: 'Robots.txt Checker', description: 'Fetch and inspect a website robots.txt file.', category: 'seo', mode: 'server' },
  { slug: 'sitemap-checker', title: 'Sitemap Checker', description: 'Fetch and inspect a public XML sitemap.', category: 'seo', mode: 'server' },
  { slug: 'website-link-extractor', title: 'Website Link Extractor', description: 'Extract internal and external links from a page.', category: 'seo', mode: 'server' },
  { slug: 'page-size-checker', title: 'Web Page Size Checker', description: 'Measure HTML response size and important headers.', category: 'seo', mode: 'server' },

  // Calculators
  { slug: 'percentage-calculator', title: 'Percentage Calculator', description: 'Calculate percentages and percentage changes.', category: 'calculator' },
  { slug: 'age-calculator', title: 'Age Calculator', description: 'Calculate age from a birth date.', category: 'calculator' },
  { slug: 'date-difference', title: 'Date Difference Calculator', description: 'Calculate the duration between two dates.', category: 'calculator' },
  { slug: 'emi-calculator', title: 'Loan & EMI Calculator', description: 'Calculate monthly loan payments and total interest.', category: 'calculator', popular: true },
  { slug: 'discount-calculator', title: 'Discount Calculator', description: 'Calculate sale price and amount saved.', category: 'calculator' },
  { slug: 'profit-margin', title: 'Profit Margin Calculator', description: 'Calculate profit, margin and markup.', category: 'calculator' },
  { slug: 'bmi-calculator', title: 'BMI Calculator', description: 'Calculate body mass index for general information.', category: 'calculator' },
  { slug: 'scientific-calculator', title: 'Scientific Calculator', description: 'Evaluate scientific arithmetic expressions.', category: 'calculator' },
  { slug: 'unit-converter', title: 'Unit Converter', description: 'Convert common length, mass and temperature units.', category: 'calculator' },
  { slug: 'data-storage-converter', title: 'Data Storage Converter', description: 'Convert bit, byte, KB, MB, GB and TB values.', category: 'calculator' },
  { slug: 'compound-interest-calculator', title: 'Compound Interest Calculator', description: 'Calculate compound growth over time.', category: 'calculator' },
  { slug: 'simple-interest-calculator', title: 'Simple Interest Calculator', description: 'Calculate simple interest and final amount.', category: 'calculator' },
  { slug: 'gst-vat-calculator', title: 'GST & VAT Calculator', description: 'Add or remove a percentage tax.', category: 'calculator' },
  { slug: 'tip-calculator', title: 'Tip Calculator', description: 'Calculate a tip and split a bill.', category: 'calculator' },
  { slug: 'average-calculator', title: 'Average Calculator', description: 'Calculate mean, median, minimum and maximum.', category: 'calculator' },
  { slug: 'fraction-calculator', title: 'Fraction Calculator', description: 'Add, subtract, multiply or divide fractions.', category: 'calculator' },
  { slug: 'binary-calculator', title: 'Binary Calculator', description: 'Convert and calculate binary and decimal values.', category: 'calculator' },
  { slug: 'time-duration-calculator', title: 'Time Duration Calculator', description: 'Calculate duration between two clock times.', category: 'calculator' },

  { slug: 'image-to-text', title: 'Image to Text OCR', description: 'Extract English text from an image in the browser.', category: 'ocr', popular: true },

  // Video tools — FFmpeg on VPS
  { slug: 'video-compressor', title: 'Video Compressor', description: 'Compress a video with an adjustable quality preset.', category: 'video', mode: 'server', popular: true },
  { slug: 'video-converter', title: 'Video Converter', description: 'Convert common video formats to MP4, WebM or MOV.', category: 'video', mode: 'server' },
  { slug: 'video-trimmer', title: 'Video Trimmer', description: 'Trim a video using start time and duration.', category: 'video', mode: 'server' },
  { slug: 'video-cropper', title: 'Video Cropper', description: 'Crop a video using width, height and offsets.', category: 'video', mode: 'server' },
  { slug: 'video-resizer', title: 'Video Resizer', description: 'Resize a video to chosen dimensions.', category: 'video', mode: 'server' },
  { slug: 'video-rotator', title: 'Video Rotator', description: 'Rotate a video by 90, 180 or 270 degrees.', category: 'video', mode: 'server' },
  { slug: 'video-speed-changer', title: 'Video Speed Changer', description: 'Speed up or slow down video and audio.', category: 'video', mode: 'server' },
  { slug: 'mute-video', title: 'Mute Video', description: 'Remove all audio from a video.', category: 'video', mode: 'server' },
  { slug: 'video-to-gif', title: 'Video to GIF', description: 'Create an animated GIF from a video segment.', category: 'video', mode: 'server' },
  { slug: 'extract-video-frames', title: 'Extract Video Frames', description: 'Extract video frames into a ZIP archive.', category: 'video', mode: 'server' },
  { slug: 'video-watermark', title: 'Video Watermark', description: 'Add a text watermark to a video.', category: 'video', mode: 'server' },
  { slug: 'add-audio-to-video', title: 'Add Audio to Video', description: 'Replace or add an audio track to a video.', category: 'video', mode: 'server', multiple: true },
  { slug: 'merge-videos', title: 'Merge Videos', description: 'Merge two or more compatible videos.', category: 'video', mode: 'server', multiple: true },
  { slug: 'add-subtitles', title: 'Add Subtitles', description: 'Burn SRT or VTT subtitles into a video.', category: 'video', mode: 'server', multiple: true },

  // Audio tools — FFmpeg on VPS
  { slug: 'video-to-mp3', title: 'Video to MP3', description: 'Extract an MP3 audio track from a video.', category: 'audio', mode: 'server', popular: true },
  { slug: 'audio-converter', title: 'Audio Converter', description: 'Convert common audio files to MP3, WAV, M4A or OGG.', category: 'audio', mode: 'server' },
  { slug: 'audio-compressor', title: 'Audio Compressor', description: 'Reduce audio file size using a chosen bitrate.', category: 'audio', mode: 'server' },
  { slug: 'audio-trimmer', title: 'Audio Trimmer', description: 'Trim an audio file using start time and duration.', category: 'audio', mode: 'server' },
  { slug: 'audio-merger', title: 'Audio Merger', description: 'Merge two or more compatible audio files.', category: 'audio', mode: 'server', multiple: true },
  { slug: 'audio-volume-changer', title: 'Audio Volume Changer', description: 'Increase or decrease audio volume.', category: 'audio', mode: 'server' },
  { slug: 'audio-speed-changer', title: 'Audio Speed Changer', description: 'Change audio playback speed.', category: 'audio', mode: 'server' },
  { slug: 'reverse-audio', title: 'Reverse Audio', description: 'Reverse an audio file.', category: 'audio', mode: 'server' },
  { slug: 'fade-audio', title: 'Audio Fade In & Out', description: 'Apply fade-in and fade-out effects.', category: 'audio', mode: 'server' },
  { slug: 'remove-audio-metadata', title: 'Remove Audio Metadata', description: 'Create an audio copy without metadata tags.', category: 'audio', mode: 'server' },

  // Document tools — LibreOffice and Python on VPS
  { slug: 'word-to-pdf', title: 'Word to PDF', description: 'Convert DOC or DOCX documents to PDF.', category: 'document', mode: 'server' },
  { slug: 'excel-to-pdf', title: 'Excel to PDF', description: 'Convert XLS or XLSX spreadsheets to PDF.', category: 'document', mode: 'server' },
  { slug: 'powerpoint-to-pdf', title: 'PowerPoint to PDF', description: 'Convert PPT or PPTX presentations to PDF.', category: 'document', mode: 'server' },
  { slug: 'docx-to-text', title: 'DOCX to Text', description: 'Extract text from a DOCX document.', category: 'document', mode: 'server' },
  { slug: 'docx-to-html', title: 'DOCX to HTML', description: 'Convert a DOCX document to HTML.', category: 'document', mode: 'server' },
  { slug: 'xlsx-to-csv', title: 'XLSX to CSV', description: 'Convert the first Excel worksheet to CSV.', category: 'document', mode: 'server' },
  { slug: 'csv-to-xlsx', title: 'CSV to XLSX', description: 'Convert a CSV file into an Excel workbook.', category: 'document', mode: 'server' },

  // Social downloaders — self-hosted yt-dlp, no paid API
  { slug: 'universal-media-downloader', title: 'Universal Media Downloader', description: 'Download public media from supported social platforms.', category: 'social', mode: 'server', popular: true, maxMB: 1500 },
  { slug: 'youtube-video-downloader', title: 'YouTube Video Downloader', description: 'Download a public YouTube video in an available format.', category: 'social', mode: 'server', popular: true, maxMB: 1500 },
  { slug: 'youtube-shorts-downloader', title: 'YouTube Shorts Downloader', description: 'Download a public YouTube Shorts video.', category: 'social', mode: 'server', maxMB: 1000 },
  { slug: 'youtube-playlist-downloader', title: 'YouTube Playlist Downloader', description: 'Download a limited public YouTube playlist as a ZIP.', category: 'social', mode: 'server', maxMB: 3000 },
  { slug: 'youtube-mp3-downloader', title: 'YouTube to MP3', description: 'Extract MP3 audio from a public YouTube video.', category: 'social', mode: 'server', popular: true, maxMB: 1000 },
  { slug: 'youtube-thumbnail-downloader', title: 'YouTube Thumbnail Downloader', description: 'Download the best available YouTube thumbnail.', category: 'social', mode: 'server' },
  { slug: 'instagram-post-downloader', title: 'Instagram Post Downloader', description: 'Download media from a public Instagram post.', category: 'social', mode: 'server' },
  { slug: 'instagram-reels-downloader', title: 'Instagram Reels Downloader', description: 'Download a public Instagram Reel.', category: 'social', mode: 'server', popular: true },
  { slug: 'instagram-story-downloader', title: 'Instagram Story Downloader', description: 'Download accessible Instagram Story media when server cookies permit it.', category: 'social', mode: 'server' },
  { slug: 'facebook-video-downloader', title: 'Facebook Video Downloader', description: 'Download an accessible public Facebook video.', category: 'social', mode: 'server' },
  { slug: 'facebook-reels-downloader', title: 'Facebook Reels Downloader', description: 'Download an accessible public Facebook Reel.', category: 'social', mode: 'server' },
  { slug: 'tiktok-video-downloader', title: 'TikTok Video Downloader', description: 'Download an accessible public TikTok video.', category: 'social', mode: 'server', popular: true },
  { slug: 'twitter-video-downloader', title: 'X / Twitter Video Downloader', description: 'Download media from a public X or Twitter post.', category: 'social', mode: 'server' },
  { slug: 'pinterest-media-downloader', title: 'Pinterest Media Downloader', description: 'Download accessible media from a public Pinterest URL.', category: 'social', mode: 'server' },
  { slug: 'reddit-video-downloader', title: 'Reddit Video Downloader', description: 'Download media from a public Reddit post.', category: 'social', mode: 'server' },
  { slug: 'vimeo-video-downloader', title: 'Vimeo Video Downloader', description: 'Download an accessible public Vimeo video.', category: 'social', mode: 'server' },
  { slug: 'dailymotion-video-downloader', title: 'Dailymotion Video Downloader', description: 'Download an accessible public Dailymotion video.', category: 'social', mode: 'server' },
  { slug: 'soundcloud-audio-downloader', title: 'SoundCloud Audio Downloader', description: 'Download an accessible public SoundCloud track.', category: 'social', mode: 'server' },
  { slug: 'twitch-clip-downloader', title: 'Twitch Clip Downloader', description: 'Download an accessible public Twitch clip.', category: 'social', mode: 'server' },
  { slug: 'threads-media-downloader', title: 'Threads Media Downloader', description: 'Download accessible media from a public Threads post.', category: 'social', mode: 'server' },
];

export const tools: ToolDefinition[] = specs.map(makeTool);

export const categories = (Object.keys(labels) as ToolCategory[])
  .filter((slug) => tools.some((tool) => tool.category === slug))
  .map((slug) => ({ slug, title: labels[slug], count: tools.filter((tool) => tool.category === slug).length }));

export const getTool = (slug: string) => tools.find((tool) => tool.slug === slug);
export const getCategoryTools = (category: string) => tools.filter((tool) => tool.category === category);
export const browserToolCount = tools.filter((tool) => tool.processingMode === 'browser').length;
export const serverToolCount = tools.filter((tool) => tool.processingMode === 'server').length;

export function categoryPath(category: ToolCategory): string {
  if (category === 'calculator') return '/calculators';
  if (category === 'social') return '/social-downloaders';
  if (category === 'backend') return '/server-tools';
  return `/${category}-tools`;
}
