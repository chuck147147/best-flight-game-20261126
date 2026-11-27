/* Cached, deterministic surface textures; optional in headless environments. */
(()=>{
 let ready=false, vignette, tile, puffs;
 const fx=RR.fx={disabled:false,finish,cloud};
 function init(){
  if(fx.disabled)return false;if(ready)return true;
  try{
   if(typeof document==='undefined'||typeof document.createElement!=='function')throw Error('No canvas');
   const canvas=(w,h)=>{const a=document.createElement('canvas');a.width=w;a.height=h;return a;};
   let state=7391;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
   tile=canvas(256,256);const tc=tile.getContext('2d'),data=tc.createImageData(256,256);
   for(let i=0;i<data.data.length;i+=4){const v=128+Math.round((random()+random()-1)*48);data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}tc.putImageData(data,0,0);
   vignette=canvas(1280,579);const vc=vignette.getContext('2d'),g=vc.createRadialGradient(640,300,430,640,300,920);g.addColorStop(0,'rgba(5,18,22,0)');g.addColorStop(1,'rgba(5,18,22,.36)');vc.fillStyle=g;vc.fillRect(0,0,1280,579);
   // Seed-indexed shapes are generated once, never in the frame loop.
   puffs=Array.from({length:64},()=>Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2;return{x:Math.cos(a)*.28+(random()-.5)*.08,y:Math.sin(a)*.16,r:.24+random()*.12};}));
   ready=true;return true;
  }catch(e){fx.disabled=true;return false;}
 }
 function blend(c,mode,alpha,fallback){c.globalCompositeOperation=mode;const ok=c.globalCompositeOperation===mode;if(!ok)c.globalCompositeOperation='source-over';c.globalAlpha=ok?alpha:fallback;}
 function finish(c,opts={}){
  if(!init())return;let saved=false;
  try{c.save();saved=true;c.beginPath();c.rect(0,74,1280,579);c.clip();
   const {sunX=950,sunY=242,storm=false}=opts,g=c.createRadialGradient(sunX,sunY,60,sunX,sunY,340),tone=storm?'200,214,208':'255,223,158';g.addColorStop(0,`rgba(${tone},${storm?.10:.20})`);g.addColorStop(1,`rgba(${tone},0)`);blend(c,'screen',1,.5);c.fillStyle=g;c.fillRect(0,74,1280,579);
   const grade=c.createLinearGradient(0,74,0,653);grade.addColorStop(0,'rgba(18,64,70,.12)');grade.addColorStop(.45,'rgba(18,64,70,0)');grade.addColorStop(1,'rgba(24,20,10,.12)');blend(c,'overlay',1,.5);c.fillStyle=grade;c.fillRect(0,74,1280,579);
   c.globalCompositeOperation='source-over';c.globalAlpha=1;c.drawImage(vignette,0,74);
   blend(c,'overlay',.055,.03);const pattern=c.createPattern(tile,'repeat');if(!pattern)throw Error('No pattern');c.fillStyle=pattern;c.fillRect(0,74,1280,579);
  }catch(e){fx.disabled=true;}finally{if(saved)try{c.restore();}catch(e){fx.disabled=true;}}
 }
 function cloud(c,x,y,w,h,tone='warm',alpha=.5,seed=0){
  if(!init())return;let saved=false;
  try{c.save();saved=true;c.translate(x,y);c.scale(w,h);const rgb={warm:'255,240,214',cool:'214,226,220',dark:'38,54,62'}[tone]||'214,226,220';
   const puff=(px,py,r,color,a)=>{const g=c.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${color},${a})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(px-r,py-r,r*2,r*2);};
   puff(0,.18,.5,tone==='dark'?'30,51,57':'112,150,139',alpha*.25);
   for(const p of puffs[(seed>>>0)%puffs.length])puff(p.x,p.y,p.r,rgb,alpha*.55);
  }catch(e){fx.disabled=true;}finally{if(saved)try{c.restore();}catch(e){fx.disabled=true;}}
 }
})();
