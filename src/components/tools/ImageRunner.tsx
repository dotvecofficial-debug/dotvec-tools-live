'use client';

import JSZip from 'jszip';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FileInput, DownloadButton, Message, PrivacyNote, ResetButton, copyText, fileToDataUrl, OutputCode } from './ToolShell';

type ImgInfo = { file: File; url: string; img: HTMLImageElement; width: number; height: number };

async function loadImage(file: File): Promise<ImgInfo> {
  const url = await fileToDataUrl(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { file, url, img, width: img.naturalWidth, height: img.naturalHeight };
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create image output.')), type, quality));
}

function extFor(type: string) { return type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'; }
function originalType(file: File) { return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/png'; }
function revoke(url: string) { if (url) URL.revokeObjectURL(url); }

export function ImageRunner({ slug, maxMB }: { slug: string; maxMB: number }) {
  if (slug === 'base64-to-image') return <Base64ToImage />;
  if (slug === 'favicon-generator') return <FaviconGenerator maxMB={maxMB} />;
  if (slug === 'image-to-base64') return <ImageToBase64 maxMB={maxMB} />;
  if (slug === 'image-color-palette') return <ColorPalette maxMB={maxMB} />;
  if (slug === 'image-color-picker') return <ColorPicker maxMB={maxMB} />;
  if (slug === 'bulk-image-compressor' || slug === 'bulk-image-converter') return <BulkImageProcessor slug={slug} maxMB={maxMB} />;
  if (slug === 'passport-photo-maker') return <PassportPhotoMaker maxMB={maxMB} />;
  if (slug === 'image-splitter') return <ImageSplitter maxMB={maxMB} />;
  if (slug === 'svg-to-png') return <SvgToPng maxMB={maxMB} />;

  const [info, setInfo] = useState<ImgInfo | null>(null);
  const [output, setOutput] = useState('');
  const [outputBytes, setOutputBytes] = useState(0);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState(82);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [format, setFormat] = useState('image/webp');
  const [amount, setAmount] = useState(10);
  const [text, setText] = useState('Dotvec Tools');
  const [x, setX] = useState('0');
  const [y, setY] = useState('0');
  const [color, setColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function choose(files: File[]) {
    try {
      clear();
      const selected = await loadImage(files[0]);
      setInfo(selected);
      setWidth(String(selected.width));
      setHeight(String(selected.height));
      setFormat(slug === 'image-metadata-remover' ? originalType(selected.file) : 'image/webp');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid image.');
    }
  }

  function clear() {
    revoke(output);
    setOutput('');
    setOutputBytes(0);
    setError('');
  }

  useEffect(() => () => revoke(output), [output]);

  async function process() {
    if (!info) return;
    clear();
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is unavailable.');

      let w = Math.max(1, Number(width) || info.width);
      let h = Math.max(1, Number(height) || info.height);
      let sx = 0, sy = 0, sw = info.width, sh = info.height;
      let rotate = 0, flipX = 1, flipY = 1;

      if (slug === 'image-cropper') {
        sx = Math.max(0, Number(x) || 0);
        sy = Math.max(0, Number(y) || 0);
        sw = Math.max(1, Math.min(info.width - sx, w));
        sh = Math.max(1, Math.min(info.height - sy, h));
        w = sw; h = sh;
      }
      if (slug === 'image-rotator') rotate = amount * Math.PI / 180;
      if (slug === 'image-flipper') { flipX = amount === 1 ? -1 : 1; flipY = amount === 2 ? -1 : 1; }

      const border = slug === 'add-border-to-image' ? Math.max(0, amount) : 0;
      if (slug === 'image-rotator' && Math.abs(amount) % 180 === 90) { canvas.width = h; canvas.height = w; }
      else { canvas.width = w + border * 2; canvas.height = h + border * 2; }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (border) { ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height); }

      if (slug === 'rounded-corners-image') {
        const radius = Math.min(Math.max(0, amount), Math.min(w, h) / 2);
        roundedRect(ctx, border, border, w, h, radius);
        ctx.clip();
      }

      if (slug === 'image-rotator') {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotate);
        ctx.drawImage(info.img, -w / 2, -h / 2, w, h);
      } else if (slug === 'image-flipper') {
        ctx.translate(flipX === -1 ? w : 0, flipY === -1 ? h : 0);
        ctx.scale(flipX, flipY);
        ctx.drawImage(info.img, 0, 0, w, h);
      } else {
        if (slug === 'grayscale-image') ctx.filter = 'grayscale(1)';
        if (slug === 'blur-image') ctx.filter = `blur(${amount}px)`;
        if (slug === 'brightness-contrast') ctx.filter = `brightness(${amount}%) contrast(${quality}%)`;
        ctx.drawImage(info.img, sx, sy, sw, sh, border, border, w, h);
      }

      ctx.filter = 'none';
      if (slug === 'image-watermark' || slug === 'add-text-to-image') {
        ctx.globalAlpha = quality / 100;
        ctx.font = `700 ${Math.max(16, amount)}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0,0,0,.55)';
        ctx.lineWidth = 3;
        const px = Math.max(15, Number(x) || w - ctx.measureText(text).width - 20);
        const py = Math.max(amount + 10, Number(y) || h - 20);
        ctx.strokeText(text, px, py);
        ctx.fillText(text, px, py);
        ctx.globalAlpha = 1;
      }
      if (slug === 'meme-generator') {
        const [top, bottom = ''] = text.split('|');
        ctx.font = `900 ${Math.max(24, amount)}px Impact, Arial Black, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(3, amount / 10);
        drawCenteredText(ctx, top.trim(), canvas.width / 2, amount + 12, canvas.width - 28);
        if (bottom.trim()) drawCenteredText(ctx, bottom.trim(), canvas.width / 2, canvas.height - 18, canvas.width - 28);
      }
      ctx.restore();

      const type = slug === 'image-metadata-remover' ? originalType(info.file) : (format || 'image/webp');
      const blob = await canvasBlob(canvas, type, quality / 100);
      setOutput(URL.createObjectURL(blob));
      setOutputBytes(blob.size);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image processing failed.');
    }
  }

  return <div className="card tool-workspace">
    <div className="panel tool-controls">
      <FileInput accept="image/jpeg,image/png,image/webp" maxMB={maxMB} onFiles={choose} />
      {info && <>
        <div className="status">{info.file.name} · {info.width}×{info.height} · {(info.file.size / 1024).toFixed(1)} KB</div>
        <ImageControls slug={slug} quality={quality} setQuality={setQuality} width={width} setWidth={setWidth} height={height} setHeight={setHeight} format={format} setFormat={setFormat} amount={amount} setAmount={setAmount} text={text} setText={setText} x={x} setX={setX} y={y} setY={setY} color={color} setColor={setColor} />
        <div className="action-row">
          <button className="btn btn-primary" onClick={process}>Process image</button>
          {output && <DownloadButton url={output} name={`dotvec-${slug}.${extFor(slug === 'image-metadata-remover' ? originalType(info.file) : format)}`} />}
          <ResetButton onClick={() => { setInfo(null); clear(); }} />
        </div>
      </>}
      {outputBytes > 0 && <Message type="success">Result size: {(outputBytes / 1024).toFixed(1)} KB{info ? ` · ${Math.round((1 - outputBytes / info.file.size) * 100)}% size change` : ''}</Message>}
      {error && <Message type="error">{error}</Message>}
      <PrivacyNote />
    </div>
    <div className="panel"><h3>Preview</h3><div className="preview-box">{output ? <img src={output} alt="Processed result" /> : info ? <img src={info.url} alt="Original upload" /> : <span className="muted">Select an image to preview it.</span>}</div><canvas ref={canvasRef} style={{ display: 'none' }} /></div>
  </div>;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.closePath();
}

function drawCenteredText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number) {
  if (!value) return;
  ctx.strokeText(value.toUpperCase(), x, y, maxWidth);
  ctx.fillText(value.toUpperCase(), x, y, maxWidth);
}

function ImageControls(props: any) {
  const { slug, quality, setQuality, width, setWidth, height, setHeight, format, setFormat, amount, setAmount, text, setText, x, setX, y, setY, color, setColor } = props;
  const showDims = ['image-compressor', 'image-resizer', 'image-cropper', 'image-converter', 'social-media-image-resizer', 'image-metadata-remover', 'rounded-corners-image', 'add-border-to-image', 'meme-generator'].includes(slug);
  return <>
    {showDims && <div className="grid grid-2"><div className="field"><label className="label">Width</label><input className="input" type="number" value={width} onChange={(event) => setWidth(event.target.value)} /></div><div className="field"><label className="label">Height</label><input className="input" type="number" value={height} onChange={(event) => setHeight(event.target.value)} /></div></div>}
    {slug === 'social-media-image-resizer' && <div className="field"><label className="label">Preset</label><select className="select" onChange={(event) => { const [w, h] = event.target.value.split('x'); setWidth(w); setHeight(h); }} defaultValue="1080x1080"><option value="1080x1080">Instagram square 1080×1080</option><option value="1080x1350">Instagram portrait 1080×1350</option><option value="1080x1920">Story / Reel 1080×1920</option><option value="1280x720">YouTube thumbnail 1280×720</option><option value="1200x630">Facebook / Open Graph 1200×630</option><option value="1500x500">X header 1500×500</option></select></div>}
    {slug === 'image-cropper' && <div className="grid grid-2"><div className="field"><label className="label">Crop X</label><input className="input" type="number" value={x} onChange={(event) => setX(event.target.value)} /></div><div className="field"><label className="label">Crop Y</label><input className="input" type="number" value={y} onChange={(event) => setY(event.target.value)} /></div></div>}
    {['image-compressor', 'image-converter', 'image-resizer', 'social-media-image-resizer', 'rounded-corners-image', 'add-border-to-image', 'meme-generator'].includes(slug) && <><div className="field"><label className="label">Output format</label><select className="select" value={format} onChange={(event) => setFormat(event.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></div><div className="field"><label className="label">Quality: {quality}%</label><input className="range" type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></div></>}
    {slug === 'image-rotator' && <div className="field"><label className="label">Rotation: {amount}°</label><input className="range" type="range" min="-180" max="180" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>}
    {slug === 'image-flipper' && <div className="field"><label className="label">Flip direction</label><select className="select" value={amount} onChange={(event) => setAmount(Number(event.target.value))}><option value="1">Horizontal</option><option value="2">Vertical</option></select></div>}
    {slug === 'blur-image' && <div className="field"><label className="label">Blur: {amount}px</label><input className="range" type="range" min="0" max="30" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>}
    {slug === 'brightness-contrast' && <><div className="field"><label className="label">Brightness: {amount}%</label><input className="range" type="range" min="0" max="200" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div><div className="field"><label className="label">Contrast: {quality}%</label><input className="range" type="range" min="0" max="200" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></div></>}
    {['image-watermark', 'add-text-to-image'].includes(slug) && <><div className="field"><label className="label">Text</label><input className="input" value={text} onChange={(event) => setText(event.target.value)} /></div><div className="grid grid-2"><div className="field"><label className="label">Font size</label><input className="input" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div><div className="field"><label className="label">Text color</label><input className="input" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></div></div><div className="field"><label className="label">Opacity: {quality}%</label><input className="range" type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></div><div className="grid grid-2"><div className="field"><label className="label">X position</label><input className="input" type="number" value={x} onChange={(event) => setX(event.target.value)} /></div><div className="field"><label className="label">Y position</label><input className="input" type="number" value={y} onChange={(event) => setY(event.target.value)} /></div></div></>}
    {slug === 'rounded-corners-image' && <div className="field"><label className="label">Corner radius: {amount}px</label><input className="range" type="range" min="0" max="300" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>}
    {slug === 'add-border-to-image' && <div className="grid grid-2"><div className="field"><label className="label">Border width</label><input className="input" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div><div className="field"><label className="label">Border color</label><input className="input" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></div></div>}
    {slug === 'meme-generator' && <><div className="field"><label className="label">Top text | Bottom text</label><input className="input" value={text} onChange={(event) => setText(event.target.value)} placeholder="TOP TEXT | BOTTOM TEXT" /></div><div className="field"><label className="label">Font size</label><input className="input" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div></>}
  </>;
}

function BulkImageProcessor({ slug, maxMB }: { slug: string; maxMB: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(82);
  const [format, setFormat] = useState('image/webp');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run() {
    setBusy(true); setError('');
    try {
      const zip = new JSZip();
      for (const file of files) {
        const info = await loadImage(file);
        const canvas = document.createElement('canvas'); canvas.width = info.width; canvas.height = info.height;
        canvas.getContext('2d')!.drawImage(info.img, 0, 0);
        const type = slug === 'bulk-image-converter' ? format : (file.type === 'image/png' ? 'image/webp' : file.type || 'image/webp');
        const blob = await canvasBlob(canvas, type, quality / 100);
        zip.file(`${file.name.replace(/\.[^.]+$/, '')}.${extFor(type)}`, blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `dotvec-${slug}.zip`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Bulk processing failed.'); }
    finally { setBusy(false); }
  }
  return <div className="card tool-workspace"><div className="panel tool-controls"><FileInput accept="image/jpeg,image/png,image/webp" multiple maxMB={maxMB} onFiles={setFiles} /><div className="field"><label className="label">Quality: {quality}%</label><input className="range" type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></div>{slug === 'bulk-image-converter' && <div className="field"><label className="label">Output format</label><select className="select" value={format} onChange={(event) => setFormat(event.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></div>}<div className="action-row"><button className="btn btn-primary" disabled={!files.length || busy} onClick={run}>{busy ? 'Creating ZIP…' : `Process ${files.length || ''} images`}</button><ResetButton onClick={() => { setFiles([]); setError(''); }} /></div>{error && <Message type="error">{error}</Message>}<PrivacyNote /></div><div className="panel"><h3>Batch result</h3><Message>{files.length ? `${files.length} image(s) selected. The result downloads as one ZIP file.` : 'Select multiple images to begin.'}</Message></div></div>;
}

function PassportPhotoMaker({ maxMB }: { maxMB: number }) {
  const [info, setInfo] = useState<ImgInfo | null>(null); const [busy, setBusy] = useState(false);
  async function generate() {
    if (!info) return; setBusy(true);
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1800;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const photoW = 413, photoH = 531, gapX = 80, gapY = 70, startX = 147, startY = 68;
    for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) drawCover(ctx, info.img, startX + col * (photoW + gapX), startY + row * (photoH + gapY), photoW, photoH);
    const blob = await canvasBlob(canvas, 'image/jpeg', 0.94); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dotvec-passport-photo-sheet.jpg'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); setBusy(false);
  }
  return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/*" maxMB={maxMB} onFiles={async (files) => setInfo(await loadImage(files[0]))} /><div className="action-row"><button className="btn btn-primary" disabled={!info || busy} onClick={generate}>{busy ? 'Generating…' : 'Download 4×6 photo sheet'}</button></div><PrivacyNote /></div><div className="panel"><div className="preview-box">{info ? <img src={info.url} alt="Passport source" /> : <span className="muted">Use a front-facing portrait with a plain background.</span>}</div><p className="help">This creates a printable 1200×1800 JPG with six approximately 35×45 mm photos. Verify official requirements before use.</p></div></div>;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight); const sw = w / scale, sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function ImageSplitter({ maxMB }: { maxMB: number }) {
  const [info, setInfo] = useState<ImgInfo | null>(null); const [rows, setRows] = useState(3); const [cols, setCols] = useState(3); const [busy, setBusy] = useState(false);
  async function split() {
    if (!info) return; setBusy(true); const zip = new JSZip(); const tileW = Math.floor(info.width / cols), tileH = Math.floor(info.height / rows);
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) { const canvas = document.createElement('canvas'); canvas.width = tileW; canvas.height = tileH; canvas.getContext('2d')!.drawImage(info.img, col * tileW, row * tileH, tileW, tileH, 0, 0, tileW, tileH); zip.file(`tile-${row + 1}-${col + 1}.png`, await canvasBlob(canvas, 'image/png')); }
    const blob = await zip.generateAsync({ type: 'blob' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dotvec-image-tiles.zip'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); setBusy(false);
  }
  return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/*" maxMB={maxMB} onFiles={async (files) => setInfo(await loadImage(files[0]))} /><div className="grid grid-2"><div className="field"><label className="label">Rows</label><input className="input" type="number" min="1" max="10" value={rows} onChange={(event) => setRows(Math.max(1, Math.min(10, Number(event.target.value))))} /></div><div className="field"><label className="label">Columns</label><input className="input" type="number" min="1" max="10" value={cols} onChange={(event) => setCols(Math.max(1, Math.min(10, Number(event.target.value))))} /></div></div><button className="btn btn-primary" disabled={!info || busy} onClick={split}>{busy ? 'Creating ZIP…' : 'Split and download ZIP'}</button><PrivacyNote /></div><div className="panel"><Message>{info ? `${rows * cols} tiles will be generated.` : 'Select an image to split.'}</Message></div></div>;
}

function SvgToPng({ maxMB }: { maxMB: number }) {
  const [info, setInfo] = useState<ImgInfo | null>(null); const [width, setWidth] = useState(1024); const [error, setError] = useState('');
  async function choose(files: File[]) { try { const selected = await loadImage(files[0]); setInfo(selected); setWidth(selected.width || 1024); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid SVG.'); } }
  async function download() { if (!info) return; const ratio = info.height / info.width; const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = Math.max(1, Math.round(width * ratio)); canvas.getContext('2d')!.drawImage(info.img, 0, 0, canvas.width, canvas.height); const blob = await canvasBlob(canvas, 'image/png'); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dotvec-svg.png'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
  return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/svg+xml,.svg" maxMB={maxMB} onFiles={choose} /><div className="field"><label className="label">Output width</label><input className="input" type="number" value={width} onChange={(event) => setWidth(Math.max(1, Number(event.target.value)))} /></div><button className="btn btn-primary" disabled={!info} onClick={download}>Download PNG</button>{error && <Message type="error">{error}</Message>}<PrivacyNote /></div><div className="panel"><div className="preview-box">{info ? <img src={info.url} alt="SVG preview" /> : <span className="muted">Upload an SVG file.</span>}</div></div></div>;
}

function ImageToBase64({ maxMB }: { maxMB: number }) { const [data, setData] = useState(''); const [name, setName] = useState(''); return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/*" maxMB={maxMB} onFiles={async (files) => { setName(files[0].name); setData(await fileToDataUrl(files[0])); }} /><PrivacyNote /></div><div className="panel"><h3>Base64 data URL</h3><OutputCode value={data} />{data && <div className="action-row" style={{ marginTop: 12 }}><button className="btn btn-primary" onClick={() => copyText(data)}>Copy Base64</button><button className="btn btn-secondary" onClick={() => { const blob = new Blob([data]); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}.txt`; anchor.click(); URL.revokeObjectURL(url); }}>Download TXT</button></div>}</div></div>; }
function Base64ToImage() { const [data, setData] = useState(''); const valid = useMemo(() => /^data:image\/(png|jpeg|webp|gif);base64,/.test(data.trim()), [data]); return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Base64 image data URL</label><textarea className="textarea" value={data} onChange={(event) => setData(event.target.value)} /></div>{data && !valid && <Message type="error">Enter a complete image data URL beginning with data:image/…;base64,</Message>}</div><div className="panel"><div className="preview-box">{valid ? <img src={data} alt="Decoded image" /> : <span className="muted">Decoded image preview</span>}</div>{valid && <a className="btn btn-primary" style={{ marginTop: 12 }} href={data} download="dotvec-decoded-image.png">Download image</a>}</div></div>; }
function ColorPalette({ maxMB }: { maxMB: number }) { const [colors, setColors] = useState<string[]>([]); const [url, setUrl] = useState(''); async function choose(files: File[]) { const info = await loadImage(files[0]); setUrl(info.url); const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64; const ctx = canvas.getContext('2d')!; ctx.drawImage(info.img, 0, 0, 64, 64); const data = ctx.getImageData(0, 0, 64, 64).data; const map = new Map<string, number>(); for (let index = 0; index < data.length; index += 16) { const r = Math.round(data[index] / 32) * 32, g = Math.round(data[index + 1] / 32) * 32, b = Math.round(data[index + 2] / 32) * 32; const hex = `#${[r, g, b].map((value) => Math.min(255, value).toString(16).padStart(2, '0')).join('')}`; map.set(hex, (map.get(hex) || 0) + 1); } setColors([...map].sort((a, b) => b[1] - a[1]).slice(0, 8).map((item) => item[0])); } return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/*" maxMB={maxMB} onFiles={choose} /><PrivacyNote /></div><div className="panel">{url && <img src={url} alt="Palette source" style={{ maxHeight: 220, margin: '0 auto 18px', borderRadius: 12 }} />}<div className="grid grid-2">{colors.map((color) => <button className="card" key={color} onClick={() => copyText(color)} style={{ padding: 16, border: 0, background: color, color: 'white', textShadow: '0 1px 3px #000' }}>{color}</button>)}</div></div></div>; }
function ColorPicker({ maxMB }: { maxMB: number }) { const [info, setInfo] = useState<ImgInfo | null>(null); const [color, setColor] = useState('#000000'); const ref = useRef<HTMLCanvasElement>(null); useEffect(() => { if (info && ref.current) { ref.current.width = info.width; ref.current.height = info.height; ref.current.getContext('2d')?.drawImage(info.img, 0, 0); } }, [info]); function pick(event: React.MouseEvent<HTMLCanvasElement>) { const canvas = ref.current!; const rect = canvas.getBoundingClientRect(); const x = Math.floor((event.clientX - rect.left) * canvas.width / rect.width), y = Math.floor((event.clientY - rect.top) * canvas.height / rect.height); const data = canvas.getContext('2d')!.getImageData(x, y, 1, 1).data; setColor(`#${[data[0], data[1], data[2]].map((value) => value.toString(16).padStart(2, '0')).join('')}`); } return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/*" maxMB={maxMB} onFiles={async (files) => setInfo(await loadImage(files[0]))} /><PrivacyNote /></div><div className="panel"><div className="preview-box">{info ? <canvas ref={ref} onClick={pick} style={{ cursor: 'crosshair' }} /> : <span className="muted">Click the image after uploading.</span>}</div><button className="btn btn-secondary" style={{ marginTop: 12, background: color }} onClick={() => copyText(color)}>{color} · Copy</button></div></div>; }
function FaviconGenerator({ maxMB }: { maxMB: number }) { const [info, setInfo] = useState<ImgInfo | null>(null); const [busy, setBusy] = useState(false); async function generate() { if (!info) return; setBusy(true); const zip = new JSZip(); for (const size of [16, 32, 48, 64, 180, 192, 512]) { const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; canvas.getContext('2d')!.drawImage(info.img, 0, 0, size, size); zip.file(`favicon-${size}x${size}.png`, await canvasBlob(canvas, 'image/png')); } const blob = await zip.generateAsync({ type: 'blob' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dotvec-favicons.zip'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setBusy(false); } return <div className="card tool-workspace"><div className="panel"><FileInput accept="image/*" maxMB={maxMB} onFiles={async (files) => setInfo(await loadImage(files[0]))} /><PrivacyNote /><div className="action-row" style={{ marginTop: 16 }}><button className="btn btn-primary" disabled={!info || busy} onClick={generate}>{busy ? 'Generating…' : 'Download favicon ZIP'}</button></div></div><div className="panel"><div className="preview-box">{info ? <img src={info.url} alt="Favicon source" /> : <span className="muted">Upload a square logo for best results.</span>}</div></div></div>; }
