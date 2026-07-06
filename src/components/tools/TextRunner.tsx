'use client';

import { diffLines, diffWords } from 'diff';
import { marked } from 'marked';
import { useMemo, useRef, useState } from 'react';
import { copyText, downloadText, Message, OutputCode, ResetButton } from './ToolShell';

const stopWords = new Set('the a an and or but if then than to of in on for with at by from is are was were be been being this that these those it its as not no do does did can could should would may might will you your we our they their he she his her i me my'.split(' '));
const titleCase = (value: string) => value.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
const sentenceCase = (value: string) => value.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (character) => character.toUpperCase());

function stats(value: string) {
  const words = value.trim() ? value.trim().match(/\b[\p{L}\p{N}'-]+\b/gu) || [] : [];
  const sentences = value.trim() ? value.split(/[.!?]+(?:\s|$)/).filter(Boolean) : [];
  const paragraphs = value.trim() ? value.split(/\n\s*\n/).filter(Boolean) : [];
  return { words: words.length, chars: value.length, noSpaces: value.replace(/\s/g, '').length, lines: value ? value.split(/\r?\n/).length : 0, sentences: sentences.length, paragraphs: paragraphs.length, reading: Math.ceil(words.length / 225), speaking: Math.ceil(words.length / 130) };
}

export function TextRunner({ slug }: { slug: string }) {
  if (slug === 'text-to-speech') return <TextToSpeech />;
  if (slug === 'speech-to-text') return <SpeechToText />;

  const [input, setInput] = useState('');
  const [input2, setInput2] = useState('');
  const [output, setOutput] = useState('');
  const [option, setOption] = useState('');
  const currentStats = useMemo(() => stats(input), [input]);

  function process() {
    let out = '';
    switch (slug) {
      case 'word-counter':
      case 'character-counter': return;
      case 'case-converter': out = option === 'upper' ? input.toUpperCase() : option === 'lower' ? input.toLowerCase() : option === 'title' ? titleCase(input) : option === 'sentence' ? sentenceCase(input) : option === 'toggle' ? [...input].map((character) => character === character.toUpperCase() ? character.toLowerCase() : character.toUpperCase()).join('') : titleCase(input); break;
      case 'remove-duplicate-lines': { const seen = new Set<string>(); out = input.split(/\r?\n/).filter((line) => { const key = option === 'insensitive' ? line.toLowerCase() : line; if (seen.has(key)) return false; seen.add(key); return true; }).join('\n'); break; }
      case 'remove-extra-spaces': out = input.replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n').trim(); break;
      case 'remove-line-breaks': out = input.split(/\r?\n/).join(option || ' '); break;
      case 'add-line-numbers': { const start = Number(option) || 1; out = input.split(/\r?\n/).map((line, index) => `${start + index}. ${line}`).join('\n'); break; }
      case 'sort-lines': { const items = input.split(/\r?\n/); if (option === 'za') items.sort((a, b) => b.localeCompare(a, undefined, { numeric: true })); else if (option === 'numdesc') items.sort((a, b) => Number(b) - Number(a)); else if (option === 'numasc') items.sort((a, b) => Number(a) - Number(b)); else items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); out = items.join('\n'); break; }
      case 'reverse-text': out = option === 'words' ? input.split(/\s+/).reverse().join(' ') : option === 'lines' ? input.split(/\r?\n/).reverse().join('\n') : [...input].reverse().join(''); break;
      case 'find-replace': { const [find, ...rest] = option.split('\n'); const replacement = rest.join('\n'); out = find ? input.split(find).join(replacement) : input; break; }
      case 'slug-generator': out = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); break;
      case 'url-extractor': out = [...new Set(input.match(/https?:\/\/[^\s<>()"']+/g) || [])].join('\n'); break;
      case 'email-extractor': out = [...new Set((input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((value) => value.toLowerCase()))].join('\n'); break;
      case 'text-repeater': { const count = Math.max(1, Math.min(10000, Number(option) || 2)); out = Array.from({ length: count }, () => input).join('\n'); break; }
      case 'extract-numbers': out = [...new Set(input.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [])].join('\n'); break;
      case 'extract-hashtags': out = [...new Set(input.match(/#[\p{L}\p{N}_]+/gu) || [])].join('\n'); break;
      case 'remove-duplicate-words': { const seen = new Set<string>(); out = input.split(/(\s+)/).filter((part) => { if (/^\s+$/.test(part)) return true; const key = part.toLowerCase().replace(/^\W+|\W+$/g, ''); if (!key || !seen.has(key)) { if (key) seen.add(key); return true; } return false; }).join('').replace(/\s{2,}/g, ' '); break; }
      case 'markdown-to-html': out = String(marked.parse(input, { async: false })); break;
      case 'html-to-text': { const document = new DOMParser().parseFromString(input, 'text/html'); document.querySelectorAll('script,style,noscript').forEach((node) => node.remove()); out = document.body.textContent?.replace(/\n{3,}/g, '\n\n').trim() || ''; break; }
      case 'lorem-ipsum-generator': { const count = Math.max(1, Math.min(100, Number(option) || 3)); const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'; out = Array.from({ length: count }, () => paragraph).join('\n\n'); break; }
      case 'random-string-generator': { const length = Math.max(1, Math.min(100000, Number(option) || 32)); const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; const random = new Uint32Array(length); crypto.getRandomValues(random); out = Array.from(random, (number) => alphabet[number % alphabet.length]).join(''); break; }
      default: out = input;
    }
    setOutput(out);
  }

  if (slug === 'word-counter' || slug === 'character-counter') return <div className="card tool-workspace"><div className="panel"><label className="label">Enter or paste text</label><textarea className="textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Start typing…" style={{ minHeight: 360 }} /></div><div className="panel"><h3>Live statistics</h3><div className="stat-grid"><Stat label="Words" value={currentStats.words} /><Stat label="Characters" value={currentStats.chars} /><Stat label="Without spaces" value={currentStats.noSpaces} /><Stat label="Lines" value={currentStats.lines} /><Stat label="Sentences" value={currentStats.sentences} /><Stat label="Paragraphs" value={currentStats.paragraphs} /><Stat label="Reading min" value={currentStats.reading} /><Stat label="Speaking min" value={currentStats.speaking} /></div><div className="action-row" style={{ marginTop: 18 }}><button className="btn btn-secondary" onClick={() => copyText(input)}>Copy text</button><button className="btn btn-secondary" onClick={() => downloadText(input, 'dotvec-text.txt')}>Download TXT</button><ResetButton onClick={() => setInput('')} /></div></div></div>;
  if (slug === 'text-difference') return <DiffTool a={input} b={input2} setA={setInput} setB={setInput2} mode={option} setMode={setOption} />;
  if (slug === 'keyword-density') return <KeywordDensity input={input} setInput={setInput} />;

  return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Input</label><textarea className="textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Enter text here…" /></div><Options slug={slug} option={option} setOption={setOption} /><div className="action-row"><button className="btn btn-primary" onClick={process}>Process text</button><button className="btn btn-secondary" disabled={!output} onClick={() => copyText(output)}>Copy output</button><ResetButton onClick={() => { setInput(''); setOutput(''); setOption(''); }} /></div></div><div className="panel"><h3>Output</h3><OutputCode value={output} />{output && <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => downloadText(output, `dotvec-${slug}.${slug === 'markdown-to-html' ? 'html' : 'txt'}`, slug === 'markdown-to-html' ? 'text/html' : 'text/plain')}>Download {slug === 'markdown-to-html' ? 'HTML' : 'TXT'}</button>}</div></div>;
}

function TextToSpeech() {
  const [input, setInput] = useState(''); const [rate, setRate] = useState(1); const [pitch, setPitch] = useState(1);
  function speak() { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(input); utterance.rate = rate; utterance.pitch = pitch; speechSynthesis.speak(utterance); }
  return <div className="card tool-workspace"><div className="panel"><div className="field"><label className="label">Text to read</label><textarea className="textarea" style={{ minHeight: 300 }} value={input} onChange={(event) => setInput(event.target.value)} /></div><div className="grid grid-2"><div className="field"><label className="label">Rate: {rate.toFixed(1)}</label><input className="range" type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></div><div className="field"><label className="label">Pitch: {pitch.toFixed(1)}</label><input className="range" type="range" min="0.5" max="2" step="0.1" value={pitch} onChange={(event) => setPitch(Number(event.target.value))} /></div></div><div className="action-row"><button className="btn btn-primary" disabled={!input.trim()} onClick={speak}>Speak</button><button className="btn btn-secondary" onClick={() => speechSynthesis.pause()}>Pause</button><button className="btn btn-secondary" onClick={() => speechSynthesis.resume()}>Resume</button><button className="btn btn-secondary" onClick={() => speechSynthesis.cancel()}>Stop</button></div></div><div className="panel"><Message>The voice list and audio quality are supplied by your browser and operating system. This tool does not upload the text.</Message></div></div>;
}

function SpeechToText() {
  const [output, setOutput] = useState(''); const [active, setActive] = useState(false); const [error, setError] = useState(''); const recognition = useRef<any>(null);
  function start() { const Constructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!Constructor) { setError('Speech recognition is not supported in this browser. Chrome or Edge usually provides it.'); return; } const instance = new Constructor(); recognition.current = instance; instance.continuous = true; instance.interimResults = true; instance.lang = 'en-US'; instance.onresult = (event: any) => { let value = ''; for (let index = event.resultIndex; index < event.results.length; index++) value += event.results[index][0].transcript; setOutput((current) => `${current}${value} `); }; instance.onerror = (event: any) => setError(event.error || 'Speech recognition failed.'); instance.onend = () => setActive(false); instance.start(); setError(''); setActive(true); }
  function stop() { recognition.current?.stop(); setActive(false); }
  return <div className="card tool-workspace"><div className="panel"><div className="action-row"><button className="btn btn-primary" disabled={active} onClick={start}>{active ? 'Listening…' : 'Start microphone'}</button><button className="btn btn-secondary" disabled={!active} onClick={stop}>Stop</button><ResetButton onClick={() => setOutput('')} /></div>{error && <Message type="error">{error}</Message>}<Message>Browser speech recognition may use the browser vendor’s speech service. Availability and privacy behavior depend on the browser.</Message></div><div className="panel"><h3>Transcript</h3><textarea className="textarea" style={{ minHeight: 320 }} value={output} onChange={(event) => setOutput(event.target.value)} /><div className="action-row"><button className="btn btn-secondary" onClick={() => copyText(output)}>Copy</button><button className="btn btn-secondary" onClick={() => downloadText(output, 'dotvec-transcript.txt')}>Download TXT</button></div></div></div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="stat"><span className="muted">{label}</span><b>{value}</b></div>; }
function Options({ slug, option, setOption }: { slug: string; option: string; setOption: (value: string) => void }) {
  if (slug === 'case-converter') return <div className="field"><label className="label">Conversion</label><select className="select" value={option || 'title'} onChange={(event) => setOption(event.target.value)}><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Title Case</option><option value="sentence">Sentence case</option><option value="toggle">tOGGLE cASE</option></select></div>;
  if (slug === 'remove-duplicate-lines') return <div className="field"><label className="label">Matching</label><select className="select" value={option} onChange={(event) => setOption(event.target.value)}><option value="sensitive">Case sensitive</option><option value="insensitive">Case insensitive</option></select></div>;
  if (slug === 'remove-line-breaks') return <div className="field"><label className="label">Replacement separator</label><input className="input" value={option} onChange={(event) => setOption(event.target.value)} placeholder="Space, comma or custom text" /></div>;
  if (slug === 'add-line-numbers') return <div className="field"><label className="label">Starting number</label><input type="number" className="input" value={option || '1'} onChange={(event) => setOption(event.target.value)} /></div>;
  if (slug === 'sort-lines') return <div className="field"><label className="label">Sort order</label><select className="select" value={option || 'az'} onChange={(event) => setOption(event.target.value)}><option value="az">A to Z</option><option value="za">Z to A</option><option value="numasc">Numeric ascending</option><option value="numdesc">Numeric descending</option></select></div>;
  if (slug === 'reverse-text') return <div className="field"><label className="label">Reverse mode</label><select className="select" value={option || 'chars'} onChange={(event) => setOption(event.target.value)}><option value="chars">Characters</option><option value="words">Words</option><option value="lines">Lines</option></select></div>;
  if (slug === 'find-replace') return <div className="field"><label className="label">Find on first line, replacement on second line</label><textarea className="textarea" style={{ minHeight: 90 }} value={option} onChange={(event) => setOption(event.target.value)} placeholder={'find this\nreplace with this'} /></div>;
  if (['text-repeater', 'lorem-ipsum-generator', 'random-string-generator'].includes(slug)) return <div className="field"><label className="label">{slug === 'text-repeater' ? 'Repeat count' : slug === 'lorem-ipsum-generator' ? 'Paragraph count' : 'String length'}</label><input className="input" type="number" value={option || (slug === 'random-string-generator' ? '32' : '3')} onChange={(event) => setOption(event.target.value)} /></div>;
  return null;
}

function DiffTool({ a, b, setA, setB, mode, setMode }: { a: string; b: string; setA: (value: string) => void; setB: (value: string) => void; mode: string; setMode: (value: string) => void }) { const parts = useMemo(() => mode === 'lines' ? diffLines(a, b) : diffWords(a, b), [a, b, mode]); return <div className="card" style={{ padding: 24 }}><div className="split-inputs"><div className="field"><label className="label">Original text</label><textarea className="textarea" value={a} onChange={(event) => setA(event.target.value)} /></div><div className="field"><label className="label">Changed text</label><textarea className="textarea" value={b} onChange={(event) => setB(event.target.value)} /></div></div><div className="filters"><button className={`btn btn-sm ${mode !== 'lines' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('words')}>Word comparison</button><button className={`btn btn-sm ${mode === 'lines' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('lines')}>Line comparison</button></div><div className="panel" aria-label="Difference result">{parts.map((part, index) => <span key={index} style={{ background: part.added ? 'rgba(22,163,74,.18)' : part.removed ? 'rgba(220,38,38,.18)' : undefined, textDecoration: part.removed ? 'line-through' : undefined }}>{part.value}</span>)}</div></div>; }
function KeywordDensity({ input, setInput }: { input: string; setInput: (value: string) => void }) { const rows = useMemo(() => { const words = (input.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) || []).filter((word) => word.length > 2 && !stopWords.has(word)); const map = new Map<string, number>(); words.forEach((word) => map.set(word, (map.get(word) || 0) + 1)); return [...map].map(([word, count]) => ({ word, count, density: words.length ? count / words.length * 100 : 0 })).sort((a, b) => b.count - a.count).slice(0, 100); }, [input]); return <div className="card tool-workspace"><div className="panel"><label className="label">Content</label><textarea className="textarea" style={{ minHeight: 360 }} value={input} onChange={(event) => setInput(event.target.value)} /></div><div className="panel"><h3>Keyword density</h3>{rows.length ? <div style={{ overflow: 'auto', maxHeight: 430 }}><table className="table"><thead><tr><th>Keyword</th><th>Count</th><th>Density</th></tr></thead><tbody>{rows.map((row) => <tr key={row.word}><td>{row.word}</td><td>{row.count}</td><td>{row.density.toFixed(2)}%</td></tr>)}</tbody></table></div> : <Message>Enter text to analyze keywords.</Message>}</div></div>; }
