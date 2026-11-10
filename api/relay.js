import {request} from '../server/workflow.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Referrer-Policy','no-referrer');
 try{
 const url=new URL(req.url,'http://localhost');
 const path=url.searchParams.get('route')||url.pathname.replace(/^\/api\//,'');
 let body=req.body??{};if(typeof body==='string'){try{body=JSON.parse(body);}catch{return res.status(400).json({error:'Invalid JSON.'});}}
 if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>12000)return res.status(400).json({error:'Invalid request body.'});
 const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
 const result=await request(req.method,path,req.headers.authorization,body,ip);return res.status(200).json(result);
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'Database unavailable. Check DATABASE_URL and run the schema migration, then retry.'});}
}
