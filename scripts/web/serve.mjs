import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('out'),base=process.env.NEXT_PUBLIC_BASE_PATH??'/trama-academia',port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname===base){res.writeHead(302,{Location:base+'/'});res.end();return;}
 if(!pathname.startsWith(base+'/'))throw new Error('outside project');
 let file=path.resolve(root,'.'+pathname.slice(base.length));if(file!==root&&!file.startsWith(root+path.sep))throw new Error('outside root');
 if((await fs.stat(file)).isDirectory()){if(!pathname.endsWith('/')){res.writeHead(302,{Location:pathname+'/'+new URL(req.url,'http://localhost').search});res.end();return;}file=path.join(file,'index.html');}
 const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':body.length});res.end(body);
 }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await fs.readFile(path.join(root,'404.html')).catch(()=>Buffer.from('Página no encontrada')));}
}).listen(port,'127.0.0.1',()=>console.log(`TRAMA: http://localhost:${port}${base}/`));
