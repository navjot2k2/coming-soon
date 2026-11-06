// Cloudflare Pages Function: POST /api/quote
// Configure RESEND_API_KEY and QUOTE_FROM_EMAIL as encrypted Pages secrets.
// QUOTE_FROM_EMAIL must use a verified sending domain in Resend.
const fields=['service','name','phone','email','pickup','dropoff','date','time','details','notes'];
const allowed=['Small Moves & Relocations','Pickup & Delivery','Airport Transportation'];
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequestPost({request,env}){
 const origin=request.headers.get('Origin');
 if(origin&&new URL(origin).host!==new URL(request.url).host)return json({error:'Invalid origin.'},403);
 if(Number(request.headers.get('content-length')||0)>15000)return json({error:'Request too large.'},413);
 let data;try{data=await request.json();}catch{return json({error:'Invalid request.'},400);}
 if(!data||typeof data!=='object'||Array.isArray(data))return json({error:'Invalid request.'},400);
 if(data.website)return json({ok:true}); // honeypot
 const values={};
 for(const field of fields){if(data[field]!=null&&typeof data[field]!=='string')return json({error:'Invalid '+field+'.'},400);values[field]=String(data[field]||'').trim();if(values[field].length>2000)return json({error:'Field too long: '+field},400);}
 if(!allowed.includes(values.service)||!values.name||!values.phone||!values.pickup||!values.dropoff||!values.date||!values.time||!values.details||data.consent!==true)return json({error:'Please complete all required fields.'},400);
 if(values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))return json({error:'Invalid email address.'},400);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(values.date)||!/^\d{2}:\d{2}$/.test(values.time))return json({error:'Invalid date or time.'},400);
 if(!env.RESEND_API_KEY||!env.QUOTE_FROM_EMAIL)return json({error:'Quote submissions are being configured. Please email bookings@sunre.ca.'},503);
 const rows=fields.map(f=>'<tr><th style="text-align:left;padding:8px;border:1px solid #ddd">'+escapeHtml(f)+'</th><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">'+escapeHtml(values[f])+'</td></tr>').join('');
 const payload={from:env.QUOTE_FROM_EMAIL,to:['bookings@sunre.ca'],subject:'Sun Movers quote request — '+values.service,html:'<h2>New Sun Movers quote request</h2><table style="border-collapse:collapse">'+rows+'</table>'};
 if(values.email)payload.reply_to=values.email;
 try{const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!result.ok)return json({error:'Unable to send request. Please email bookings@sunre.ca.'},502);
 return json({ok:true});}catch{return json({error:'Unable to send request. Please email bookings@sunre.ca.'},502);}
}
export function onRequestGet(){return json({error:'Method not allowed.'},405);}
