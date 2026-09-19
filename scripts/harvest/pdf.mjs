import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export async function extractPdfText(page){
 const result=await new Promise((resolve,reject)=>{
  const child=execFile(process.env.TRAMA_PYTHON||'python3',[fileURLToPath(new URL('./pdf-text.py',import.meta.url))],{timeout:60000,maxBuffer:4_000_000},(error,stdout)=>{
   if(error)return reject(new Error('pdf_extraction_failed'));
   try{resolve(JSON.parse(stdout));}catch{reject(new Error('pdf_extraction_invalid'));}
  });
  child.stdin.on('error',()=>{});child.stdin.end(Buffer.from(page.body,'base64'));
 });
 if(!Array.isArray(result.pages)||result.pages.join('').length<500)throw new Error('pdf_text_missing');
 // The generated footer changes on each request and can split a sentence at a
 // page boundary. Remove only that known footer before joining the pages.
 return result.pages.map(p=>p.replace(/(?:Advertisement text|Utlysningstekst)[^\n]*\.pdf[^\n]*?(?:Page|Side)\s+\d+\s*\/\s*\d+/gi,'')).join('\n');
}
