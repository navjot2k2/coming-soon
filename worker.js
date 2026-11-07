import { onRequestPost } from './functions/api/quote.js';
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/api/quote'){
   if(request.method==='POST')return onRequestPost({request,env});
   return new Response(JSON.stringify({error:'Method not allowed.'}),{status:405,headers:{'Content-Type':'application/json'}});
  }
  return env.ASSETS.fetch(request);
 }
};
