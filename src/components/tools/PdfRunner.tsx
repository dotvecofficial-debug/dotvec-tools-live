'use client';

import JSZip from 'jszip';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';
import { DownloadButton, FileInput, Message, PrivacyNote, ResetButton, downloadText } from './ToolShell';

type Selected = { file: File; bytes: ArrayBuffer; pages?: number };
type RenderedImage = { url: string; name: string; blob: Blob };

function parsePages(text: string, total: number): number[] {
  const set = new Set<number>();
  for (const part of text.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (part.includes('-')) {
      let [a, b] = part.split('-').map(Number);
      if (a > b) [a, b] = [b, a];
      for (let index = a; index <= b; index++) if (index >= 1 && index <= total) set.add(index - 1);
    } else {
      const number = Number(part);
      if (number >= 1 && number <= total) set.add(number - 1);
    }
  }
  return [...set].sort((a, b) => a - b);
}

async function inspect(file: File): Promise<Selected> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
  return { file, bytes, pages: pdf.getPageCount() };
}

function makeUrl(blob: Blob) { return URL.createObjectURL(blob); }
function extFor(type: string) { return type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'; }
function toBlob(bytes: Uint8Array, type = 'application/pdf') { return new Blob([bytes as unknown as BlobPart], { type }); }
function allPages(total: number) { return [...Array(total)].map((_, index) => index); }


async function imageForPdf(file: File): Promise<{ bytes: Uint8Array; kind: 'png' | 'jpg'; width: number; height: number }> {
  const original = new Uint8Array(await file.arrayBuffer());
  if (file.type === 'image/png') {
    const bitmap = await createImageBitmap(file);
    const result = { bytes: original, kind: 'png' as const, width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  }
  if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) {
    const bitmap = await createImageBitmap(file);
    const result = { bytes: original, kind: 'jpg' as const, width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not prepare the image.');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Image conversion failed.')), 'image/png'));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: 'png', width: canvas.width, height: canvas.height };
}

export function PdfRunner({ slug, maxMB }: { slug: string; maxMB: number }) {
  if (slug === 'text-to-pdf') return <TextToPdf />;

  const [files, setFiles] = useState<Selected[]>([]);
  const [overlay, setOverlay] = useState<File | null>(null);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [pages, setPages] = useState('1');
  const [text, setText] = useState('Dotvec Tools');
  const [option, setOption] = useState('');
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<RenderedImage[]>([]);
  const [textOutput, setTextOutput] = useState('');

  useEffect(() => () => {
    if (output) URL.revokeObjectURL(output);
    images.forEach((image) => URL.revokeObjectURL(image.url));
  }, [output, images]);

  async function choose(list: File[]) {
    setError('');
    try {
      const selected = await Promise.all(list.map(inspect));
      setFiles(slug === 'merge-pdf' ? selected : selected.slice(0, 1));
      setPages('1');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open PDF.');
    }
  }

  async function chooseImages(list: File[]) {
    setError('');
    try {
      const selected = await Promise.all(list.map(async (file) => ({ file, bytes: await file.arrayBuffer() })));
      setFiles(selected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read images.');
    }
  }

  function clearResults() {
    if (output) URL.revokeObjectURL(output);
    images.forEach((image) => URL.revokeObjectURL(image.url));
    setOutput('');
    setImages([]);
    setTextOutput('');
  }

  function reset() {
    clearResults();
    setFiles([]);
    setOverlay(null);
    setError('');
    setPages('1');
    setText('Dotvec Tools');
    setOption('');
  }

  async function run() {
    setBusy(true);
    setError('');
    clearResults();
    try {
      if (slug === 'merge-pdf') return await merge();
      if (slug === 'images-to-pdf') return await imagesPdf();
      if (['pdf-to-jpg', 'pdf-to-png', 'pdf-to-webp'].includes(slug)) return await renderImages();
      if (slug === 'pdf-to-text') return await extractText();

      const source = files[0];
      if (!source) throw new Error('Select a PDF first.');
      const pdf = await PDFDocument.load(source.bytes.slice(0));
      const total = pdf.getPageCount();
      const selected = parsePages(pages, total);
      let out: PDFDocument;

      switch (slug) {
        case 'split-pdf': {
          const zip = new JSZip();
          const targets = selected.length ? selected : allPages(total);
          for (const index of targets) {
            const one = await PDFDocument.create();
            const [page] = await one.copyPages(pdf, [index]);
            one.addPage(page);
            zip.file(`page-${index + 1}.pdf`, await one.save());
          }
          setOutput(makeUrl(await zip.generateAsync({ type: 'blob' })));
          return;
        }
        case 'extract-pdf-pages': {
          if (!selected.length) throw new Error('Enter pages to extract.');
          out = await PDFDocument.create();
          for (const page of await out.copyPages(pdf, selected)) out.addPage(page);
          break;
        }
        case 'remove-pdf-pages': {
          if (!selected.length) throw new Error('Enter pages to remove.');
          if (selected.length >= total) throw new Error('At least one page must remain.');
          out = await PDFDocument.create();
          const keep = allPages(total).filter((index) => !selected.includes(index));
          for (const page of await out.copyPages(pdf, keep)) out.addPage(page);
          break;
        }
        case 'reorder-pdf-pages': {
          const order = pages.split(',').map((item) => Number(item.trim()) - 1);
          if (order.length !== total || new Set(order).size !== total || order.some((index) => index < 0 || index >= total)) {
            throw new Error(`Enter every page once, for example ${allPages(total).map((index) => index + 1).reverse().join(',')}.`);
          }
          out = await PDFDocument.create();
          for (const page of await out.copyPages(pdf, order)) out.addPage(page);
          break;
        }
        case 'reverse-pdf-pages': {
          out = await PDFDocument.create();
          for (const page of await out.copyPages(pdf, allPages(total).reverse())) out.addPage(page);
          break;
        }
        case 'duplicate-pdf-pages': {
          if (!selected.length) throw new Error('Enter the pages to duplicate.');
          out = await PDFDocument.create();
          const order = allPages(total).flatMap((index) => selected.includes(index) ? [index, index] : [index]);
          for (const page of await out.copyPages(pdf, order)) out.addPage(page);
          break;
        }
        case 'rotate-pdf-pages': {
          const targets = selected.length ? selected : allPages(total);
          const angle = Number(option) || 90;
          targets.forEach((index) => {
            const page = pdf.getPage(index);
            page.setRotation(degrees((page.getRotation().angle + angle + 360) % 360));
          });
          out = pdf;
          break;
        }
        case 'watermark-pdf': {
          const font = await pdf.embedFont(StandardFonts.HelveticaBold);
          const targets = selected.length ? selected : allPages(total);
          for (const index of targets) {
            const page = pdf.getPage(index);
            const size = Number(option) || 36;
            page.drawText(text, { x: 40, y: page.getHeight() / 2, size, font, color: rgb(0.45, 0.45, 0.45), opacity: 0.35, rotate: degrees(30) });
          }
          out = pdf;
          break;
        }
        case 'page-numbers-pdf': {
          const font = await pdf.embedFont(StandardFonts.Helvetica);
          const [position = 'bottom', startRaw = '1', sizeRaw = '12'] = option.split(',');
          const start = Number(startRaw) || 1;
          const size = Number(sizeRaw) || 12;
          pdf.getPages().forEach((page, index) => {
            const label = String(start + index);
            const x = page.getWidth() / 2 - font.widthOfTextAtSize(label, size) / 2;
            const y = position.trim() === 'top' ? page.getHeight() - size - 14 : 18;
            page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
          });
          out = pdf;
          break;
        }
        case 'add-text-pdf': {
          const page = pdf.getPage(selected[0] ?? 0);
          const font = await pdf.embedFont(StandardFonts.Helvetica);
          const [xRaw, yRaw, sizeRaw] = option.split(',');
          page.drawText(text, { x: Number(xRaw) || 40, y: Number(yRaw) || page.getHeight() - 80, size: Number(sizeRaw) || 24, font, color: rgb(0.1, 0.1, 0.1) });
          out = pdf;
          break;
        }
        case 'add-image-pdf': {
          if (!overlay) throw new Error('Select an overlay image.');
          const bytes = new Uint8Array(await overlay.arrayBuffer());
          const embedded = overlay.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const page = pdf.getPage(selected[0] ?? 0);
          const [xRaw, yRaw, widthRaw] = option.split(',');
          const drawWidth = Number(widthRaw) || Math.min(180, embedded.width);
          const drawHeight = drawWidth * embedded.height / embedded.width;
          page.drawImage(embedded, { x: Number(xRaw) || 40, y: Number(yRaw) || 40, width: drawWidth, height: drawHeight });
          out = pdf;
          break;
        }
        case 'sign-pdf': {
          const page = pdf.getPage(selected[0] ?? 0);
          const font = await pdf.embedFont(StandardFonts.HelveticaOblique);
          const [xRaw, yRaw, sizeRaw] = option.split(',');
          page.drawText(text || 'Signature', { x: Number(xRaw) || 50, y: Number(yRaw) || 50, size: Number(sizeRaw) || 28, font, color: rgb(0.05, 0.12, 0.3) });
          out = pdf;
          break;
        }
        case 'pdf-metadata': {
          pdf.setTitle(text || '');
          pdf.setAuthor(option || '');
          out = pdf;
          break;
        }
        case 'pdf-page-size': {
          const [paper = 'a4', orientation = 'portrait'] = option.split(',');
          let [pageWidth, pageHeight] = paper === 'letter' ? [612, 792] : paper === 'legal' ? [612, 1008] : [595.28, 841.89];
          if (orientation === 'landscape') [pageWidth, pageHeight] = [pageHeight, pageWidth];
          out = await PDFDocument.create();
          const embedded = await out.embedPdf(await pdf.save(), allPages(total));
          embedded.forEach((sourcePage) => {
            const page = out.addPage([pageWidth, pageHeight]);
            const scale = Math.min(pageWidth / sourcePage.width, pageHeight / sourcePage.height);
            page.drawPage(sourcePage, { x: (pageWidth - sourcePage.width * scale) / 2, y: (pageHeight - sourcePage.height * scale) / 2, xScale: scale, yScale: scale });
          });
          break;
        }
        case 'crop-pdf-pages': {
          const [leftRaw = '0', topRaw = '0', rightRaw = '0', bottomRaw = '0'] = option.split(',');
          const left = Math.max(0, Number(leftRaw) || 0), top = Math.max(0, Number(topRaw) || 0), right = Math.max(0, Number(rightRaw) || 0), bottom = Math.max(0, Number(bottomRaw) || 0);
          const targets = selected.length ? selected : allPages(total);
          targets.forEach((index) => {
            const page = pdf.getPage(index); const width = page.getWidth(), height = page.getHeight();
            if (left + right >= width || top + bottom >= height) throw new Error('Crop margins are larger than the page.');
            page.setCropBox(left, bottom, width - left - right, height - top - bottom);
          });
          out = pdf;
          break;
        }
        case 'n-up-pdf': {
          const count = Number(option) === 4 ? 4 : 2;
          out = await PDFDocument.create();
          const embeddedPages = await out.embedPdf(await pdf.save(), allPages(total));
          const sheetWidth = 595.28, sheetHeight = 841.89;
          for (let start = 0; start < embeddedPages.length; start += count) {
            const sheet = out.addPage([sheetWidth, sheetHeight]);
            const cols = count === 4 ? 2 : 1, rows = count === 4 ? 2 : 2;
            for (let offset = 0; offset < count && start + offset < embeddedPages.length; offset++) {
              const embeddedPage = embeddedPages[start + offset];
              const col = offset % cols, row = Math.floor(offset / cols);
              const cellW = sheetWidth / cols, cellH = sheetHeight / rows;
              const scale = Math.min((cellW - 18) / embeddedPage.width, (cellH - 18) / embeddedPage.height);
              sheet.drawPage(embeddedPage, { x: col * cellW + (cellW - embeddedPage.width * scale) / 2, y: sheetHeight - (row + 1) * cellH + (cellH - embeddedPage.height * scale) / 2, xScale: scale, yScale: scale });
            }
          }
          break;
        }
        case 'flatten-pdf-forms': {
          const form = pdf.getForm();
          if (form.getFields().length) form.flatten();
          out = pdf;
          break;
        }
        default: out = pdf;
      }

      setOutput(makeUrl(toBlob(await out.save())));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'PDF processing failed.');
    } finally {
      setBusy(false);
    }
  }

  async function merge() {
    if (files.length < 2) throw new Error('Select at least two PDF files.');
    const out = await PDFDocument.create();
    for (const file of files) {
      const source = await PDFDocument.load(file.bytes.slice(0));
      for (const page of await out.copyPages(source, source.getPageIndices())) out.addPage(page);
    }
    setOutput(makeUrl(toBlob(await out.save())));
  }

  async function imagesPdf() {
    if (!files.length) throw new Error('Select one or more JPG, PNG or WebP images.');
    const out = await PDFDocument.create();
    const [format = 'a4-fit', marginRaw = '24'] = option.split(',');
    const margin = Math.max(0, Math.min(100, Number(marginRaw) || 24));
    for (const selected of files) {
      const prepared = await imageForPdf(selected.file);
      const image = prepared.kind === 'png' ? await out.embedPng(prepared.bytes) : await out.embedJpg(prepared.bytes);
      let pageWidth = image.width;
      let pageHeight = image.height;
      if (format !== 'original') {
        const portrait = image.height >= image.width;
        const base = format.startsWith('letter') ? [612, 792] : [595.28, 841.89];
        pageWidth = portrait ? base[0] : base[1];
        pageHeight = portrait ? base[1] : base[0];
      }
      const page = out.addPage([Math.max(72, pageWidth), Math.max(72, pageHeight)]);
      const availableWidth = Math.max(1, page.getWidth() - margin * 2);
      const availableHeight = Math.max(1, page.getHeight() - margin * 2);
      const scale = Math.min(availableWidth / image.width, availableHeight / image.height, format === 'original' ? 1 : Number.POSITIVE_INFINITY);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      page.drawImage(image, { x: (page.getWidth() - drawWidth) / 2, y: (page.getHeight() - drawHeight) / 2, width: drawWidth, height: drawHeight });
    }
    const bytes = await out.save();
    if (!bytes.length) throw new Error('The PDF could not be generated.');
    setOutput(makeUrl(toBlob(bytes)));
  }

  async function renderImages() {
    const file = files[0];
    if (!file) throw new Error('Select a PDF first.');
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(file.bytes.slice(0)) }).promise;
    const targets = parsePages(pages, pdfDocument.numPages);
    const indexes = targets.length ? targets : allPages(pdfDocument.numPages);
    const type = slug === 'pdf-to-png' ? 'image/png' : slug === 'pdf-to-webp' ? 'image/webp' : 'image/jpeg';
    const extension = extFor(type);
    const rendered: RenderedImage[] = [];
    const scale = Math.max(0.5, Math.min(Number(option) || 1.5, 4));
    for (const index of indexes) {
      const page = await pdfDocument.getPage(index + 1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d')!;
      await page.render({ canvasContext: context, viewport, canvas } as never).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value: Blob | null) => value ? resolve(value) : reject(new Error('Rendering failed.')), type, 0.92));
      rendered.push({ blob, url: makeUrl(blob), name: `page-${index + 1}.${extension}` });
    }
    setImages(rendered);
  }

  async function extractText() {
    const file = files[0];
    if (!file) throw new Error('Select a PDF first.');
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(file.bytes.slice(0)) }).promise;
    const targets = parsePages(pages, pdfDocument.numPages);
    const indexes = targets.length ? targets : allPages(pdfDocument.numPages);
    const sections: string[] = [];
    for (const index of indexes) {
      const page = await pdfDocument.getPage(index + 1);
      const content = await page.getTextContent();
      const line = content.items.map((item) => 'str' in item ? item.str : '').join(' ');
      sections.push(`--- Page ${index + 1} ---\n${line}`);
    }
    setTextOutput(sections.join('\n\n'));
  }

  async function downloadImagesZip() {
    const zip = new JSZip();
    images.forEach((image) => zip.file(image.name, image.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = makeUrl(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `dotvec-${slug}.zip`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const isImages = slug === 'images-to-pdf';
  const outputName = slug === 'split-pdf' ? 'dotvec-split-pages.zip' : `dotvec-${slug}.pdf`;

  return <div className="card tool-workspace">
    <div className="panel tool-controls">
      <FileInput accept={isImages ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp' : 'application/pdf'} multiple={slug === 'merge-pdf' || isImages} maxMB={maxMB} onFiles={isImages ? chooseImages : choose} />
      {files.length > 0 && <div className="status">{files.map((file) => `${file.file.name}${file.pages ? ` · ${file.pages} pages` : ''}`).join(' | ')}</div>}
      {slug === 'add-image-pdf' && <div className="field"><label className="label">Overlay image</label><FileInput accept="image/jpeg,image/png" maxMB={20} onFiles={(selected) => setOverlay(selected[0])} />{overlay && <span className="help">Selected: {overlay.name}</span>}</div>}
      <Controls slug={slug} pages={pages} setPages={setPages} text={text} setText={setText} option={option} setOption={setOption} />
      <div className="action-row">
        <button className="btn btn-primary" disabled={busy || !files.length} onClick={run}>{busy ? 'Processing…' : 'Process PDF'}</button>
        {output && <DownloadButton url={output} name={outputName} />}
        {textOutput && <button className="btn btn-primary" onClick={() => downloadText(textOutput, 'dotvec-pdf-text.txt')}>Download TXT</button>}
        {images.length > 1 && <button className="btn btn-primary" onClick={downloadImagesZip}>Download all ZIP</button>}
        <ResetButton onClick={reset} />
      </div>
      {error && <Message type="error">{error}</Message>}
      <PrivacyNote />
    </div>
    <div className="panel"><h3>Result</h3>{textOutput ? <textarea className="textarea" style={{ minHeight: 360 }} readOnly value={textOutput} /> : images.length ? <div className="grid grid-2">{images.map((image) => <div key={image.url}><img src={image.url} alt={image.name} style={{ borderRadius: 10 }} /><a className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} href={image.url} download={image.name}>Download {image.name}</a></div>)}</div> : output ? <Message type="success">Your output is ready to download.</Message> : <Message>Choose a PDF and configure the tool.</Message>}</div>
  </div>;
}

function Controls({ slug, pages, setPages, text, setText, option, setOption }: { slug: string; pages: string; setPages: (value: string) => void; text: string; setText: (value: string) => void; option: string; setOption: (value: string) => void }) {
  const pageTools = ['split-pdf', 'extract-pdf-pages', 'remove-pdf-pages', 'reorder-pdf-pages', 'rotate-pdf-pages', 'pdf-to-jpg', 'pdf-to-png', 'pdf-to-webp', 'pdf-to-text', 'watermark-pdf', 'add-text-pdf', 'add-image-pdf', 'duplicate-pdf-pages', 'crop-pdf-pages', 'sign-pdf'];
  return <>
    {pageTools.includes(slug) && <div className="field"><label className="label">Pages or order</label><input className="input" value={pages} onChange={(event) => setPages(event.target.value)} placeholder={slug === 'reorder-pdf-pages' ? '3,2,1' : '1,3-5'} /><span className="help">Use commas and ranges, for example 1,3-5. Leave an invalid/empty selection to use all pages where supported.</span></div>}
    {['watermark-pdf', 'add-text-pdf', 'pdf-metadata', 'sign-pdf'].includes(slug) && <div className="field"><label className="label">{slug === 'pdf-metadata' ? 'PDF title' : slug === 'sign-pdf' ? 'Typed signature' : 'Text'}</label><input className="input" value={text} onChange={(event) => setText(event.target.value)} /></div>}
    {slug === 'rotate-pdf-pages' && <div className="field"><label className="label">Rotation</label><select className="select" value={option || '90'} onChange={(event) => setOption(event.target.value)}><option value="90">90° clockwise</option><option value="-90">90° counter-clockwise</option><option value="180">180°</option></select></div>}
    {slug === 'watermark-pdf' && <div className="field"><label className="label">Font size</label><input className="input" type="number" value={option || '36'} onChange={(event) => setOption(event.target.value)} /></div>}
    {slug === 'page-numbers-pdf' && <div className="field"><label className="label">Position, start number, font size</label><input className="input" value={option || 'bottom,1,12'} onChange={(event) => setOption(event.target.value)} placeholder="bottom,1,12" /></div>}
    {['add-text-pdf', 'sign-pdf'].includes(slug) && <div className="field"><label className="label">X,Y,font size</label><input className="input" value={option || (slug === 'sign-pdf' ? '50,50,28' : '40,700,24')} onChange={(event) => setOption(event.target.value)} /></div>}
    {slug === 'add-image-pdf' && <div className="field"><label className="label">X,Y,width</label><input className="input" value={option || '40,40,180'} onChange={(event) => setOption(event.target.value)} /></div>}
    {slug === 'pdf-metadata' && <div className="field"><label className="label">Author</label><input className="input" value={option} onChange={(event) => setOption(event.target.value)} /></div>}
    {slug === 'pdf-page-size' && <div className="field"><label className="label">New page size</label><select className="select" value={option || 'a4,portrait'} onChange={(event) => setOption(event.target.value)}><option value="a4,portrait">A4 portrait</option><option value="a4,landscape">A4 landscape</option><option value="letter,portrait">Letter portrait</option><option value="letter,landscape">Letter landscape</option><option value="legal,portrait">Legal portrait</option></select></div>}
    {slug === 'images-to-pdf' && <div className="field"><label className="label">PDF page format and margin</label><select className="select" value={option || 'a4-fit,24'} onChange={(event) => setOption(event.target.value)}><option value="a4-fit,24">A4 fit · 24 pt margin</option><option value="a4-fit,0">A4 fit · no margin</option><option value="letter-fit,24">Letter fit · 24 pt margin</option><option value="letter-fit,0">Letter fit · no margin</option><option value="original,0">Original image size</option></select><span className="help">JPG, PNG and WebP are supported. Every image becomes one PDF page.</span></div>}
    {['pdf-to-jpg', 'pdf-to-png', 'pdf-to-webp'].includes(slug) && <div className="field"><label className="label">Render scale</label><select className="select" value={option || '1.5'} onChange={(event) => setOption(event.target.value)}><option value="1">Standard</option><option value="1.5">High</option><option value="2">Very high</option><option value="3">Print quality</option></select></div>}
    {slug === 'n-up-pdf' && <div className="field"><label className="label">Pages per output sheet</label><select className="select" value={option || '2'} onChange={(event) => setOption(event.target.value)}><option value="2">2 pages</option><option value="4">4 pages</option></select></div>}
    {slug === 'crop-pdf-pages' && <div className="field"><label className="label">Left, top, right, bottom margins (PDF points)</label><input className="input" value={option || '20,20,20,20'} onChange={(event) => setOption(event.target.value)} /></div>}
  </>;
}

function TextToPdf() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('Dotvec Document');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true); setError('');
    try {
      if (!text.trim()) throw new Error('Enter text first.');
      const pdf = await PDFDocument.create();
      pdf.setTitle(title);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pageWidth = 595.28, pageHeight = 841.89, margin = 52, fontSize = 12, lineHeight = 17;
      let page = pdf.addPage([pageWidth, pageHeight]); let y = pageHeight - margin;
      page.drawText(title, { x: margin, y, size: 20, font: bold, color: rgb(0.08, 0.12, 0.24) }); y -= 34;
      const maxWidth = pageWidth - margin * 2;
      for (const paragraph of text.replace(/\r/g, '').split('\n')) {
        const lines = wrapText(paragraph || ' ', font, fontSize, maxWidth);
        for (const line of lines) {
          if (y < margin) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
          page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.12) }); y -= lineHeight;
        }
        y -= 4;
      }
      const blob = toBlob(await pdf.save()); const url = makeUrl(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dotvec-text-document.pdf'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create PDF.'); }
    finally { setBusy(false); }
  }
  return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Document title</label><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="field"><label className="label">Text</label><textarea className="textarea" style={{ minHeight: 360 }} value={text} onChange={(event) => setText(event.target.value)} /></div><div className="action-row"><button className="btn btn-primary" disabled={busy || !text.trim()} onClick={create}>{busy ? 'Creating…' : 'Create and download PDF'}</button><ResetButton onClick={() => { setText(''); setError(''); }} /></div>{error && <Message type="error">{error}</Message>}<PrivacyNote /></div><div className="panel"><h3>Text document</h3><Message>The PDF is generated completely in your browser with automatic page breaks and text wrapping.</Message></div></div>;
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let current = '';
  for (const word of words) { const candidate = current ? `${current} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate; else { if (current) lines.push(current); current = word; } }
  if (current) lines.push(current); return lines.length ? lines : [' '];
}
