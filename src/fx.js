/* Cached, deterministic surface textures; optional in headless environments. */
(()=>{
 let ready=false, vignette, tile, puffs, clouds;
 const fx=RR.fx={disabled:false,finish,cloud,mistStrip,mist:null,shade:null};
 function canvas(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return a;}
 function mistStrip(w=512,h=64){
  try{const a=canvas(w,h),c=a.getContext('2d');let state=18371;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
   const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(232,230,210,0)');g.addColorStop(.5,'rgba(232,230,210,.85)');g.addColorStop(1,'rgba(232,230,210,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
   c.globalCompositeOperation='destination-out';for(let i=0;i<900;i++){const x=random()*w,y=random()*h,r=2+random()*10,edge=Math.abs(y/h-.5)*2,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${.2+edge*.8})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}return a;
  }catch(e){return null;}
 }
 function init(){
  if(fx.disabled)return false;if(ready)return true;
  try{
   if(typeof document==='undefined'||typeof document.createElement!=='function')throw Error('No canvas');
   let state=7391;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
   tile=canvas(256,256);const tc=tile.getContext('2d'),data=tc.createImageData(256,256);
   for(let i=0;i<data.data.length;i+=4){const v=128+Math.round((random()+random()-1)*30);data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}tc.putImageData(data,0,0);
   vignette=canvas(1280,579);const vc=vignette.getContext('2d'),g=vc.createRadialGradient(640,300,430,640,300,920);g.addColorStop(0,'rgba(5,18,22,0)');g.addColorStop(1,'rgba(5,18,22,.44)');vc.fillStyle=g;vc.fillRect(0,0,1280,579);
   // Seed-indexed shapes are generated once, never in the frame loop.
   puffs=Array.from({length:64},()=>Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2;return{x:Math.cos(a)*.28+(random()-.5)*.08,y:Math.sin(a)*.16,r:.24+random()*.12};}));
   fx.mist=mistStrip();fx.shade=canvas(128,64);const sc=fx.shade.getContext('2d');sc.scale(64,32);const sg=sc.createRadialGradient(1,1,0,1,1,1);sg.addColorStop(0,'rgba(8,30,30,.45)');sg.addColorStop(1,'rgba(8,30,30,0)');sc.fillStyle=sg;sc.fillRect(0,0,2,2);
   clouds={};for(const tone of ['warm','cool','dark'])clouds[tone]=puffs.map(table=>{const a=canvas(512,192),c=a.getContext('2d');c.translate(256,96);c.scale(320,120);
    const puff=(x,y,r,rgb,alpha)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);};
    c.save();c.translate(0,.27);c.scale(1,.3);puff(0,0,.7,'20,54,54',.18);c.restore();
    for(const p of table){puff(p.x,p.y+.06,p.r,tone==='warm'?'96,128,124':tone==='cool'?'110,140,138':'30,51,57',.55);puff(p.x,p.y-.05,p.r*.86,tone==='warm'?'255,240,214':tone==='cool'?'214,226,220':'38,54,62',.55);}return a;});
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
  try{c.save();saved=true;c.globalAlpha*=alpha;c.drawImage((clouds[tone]||clouds.cool)[(seed>>>0)%puffs.length],x-w*.8,y-h*.8,w*1.6,h*1.6);
  }catch(e){fx.disabled=true;}finally{if(saved)try{c.restore();}catch(e){fx.disabled=true;}}
 }
})();
