/* Optional painted assets, keyed once at load; deterministic and file:// safe. */
(()=>{
 try{
  if(typeof Image==='undefined'||typeof document==='undefined'||typeof document.createElement!=='function'){RR.art={ready:()=>false,failed:true};return;}
  const assets=Object.create(null),failed=Object.create(null);
  const art=RR.art={failed:false,ready:name=>!failed[name]&&!!assets[name],img:name=>assets[name],drawChase,drawCanyon};
  function canvas(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return a;}
  function key(img){
   const w=img.naturalWidth,h=img.naturalHeight,a=canvas(w,h),c=a.getContext('2d');c.drawImage(img,0,0);
   const data=c.getImageData(0,0,w,h),pixels=data.data,n=w*h,dark=new Uint8Array(n),bg=new Uint8Array(n),seen=new Uint8Array(n),stack=new Int32Array(n),component=new Int32Array(n);
   for(let i=0;i<n;i++)dark[i]=Math.max(pixels[i*4],pixels[i*4+1],pixels[i*4+2])<=16?1:0;
   // Mark on insertion so each pixel occupies the stack at most once.
   let top=0;
   function push(i,mask){if(dark[i]&&!bg[i]&&!mask[i]){mask[i]=1;stack[top++]=i;}}
   function border(i){if(dark[i]&&!bg[i]){bg[i]=1;stack[top++]=i;}}
   for(let x=0;x<w;x++){border(x);border((h-1)*w+x);}
   for(let y=0;y<h;y++){border(y*w);border(y*w+w-1);}
   while(top){const i=stack[--top],x=i%w;if(x)border(i-1);if(x<w-1)border(i+1);if(i>=w)border(i-w);if(i<n-w)border(i+w);}
   for(let start=0;start<n;start++){
    if(!dark[start]||bg[start]||seen[start])continue;
    let count=0,sumMax=0,sumSpread=0;push(start,seen);
    while(top){const i=stack[--top],x=i%w,p=i*4,max=Math.max(pixels[p],pixels[p+1],pixels[p+2]),min=Math.min(pixels[p],pixels[p+1],pixels[p+2]);component[count++]=i;sumMax+=max;sumSpread+=max-min;if(x)push(i-1,seen);if(x<w-1)push(i+1,seen);if(i>=w)push(i-w,seen);if(i<n-w)push(i+w,seen);}
    if(sumMax/count<=2.5&&sumSpread/count<=2)for(let j=0;j<count;j++)bg[component[j]]=1;
   }
   let alpha=new Uint8Array(n),next=new Uint8Array(n);for(let i=0;i<n;i++)alpha[i]=bg[i]?0:255;
   for(let pass=0;pass<2;pass++){
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0,count=0;for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){sum+=alpha[yy*w+xx];count++;}next[y*w+x]=Math.round(sum/count);}
    const swap=alpha;alpha=next;next=swap;
   }
   for(let i=0;i<n;i++){const p=i*4,v=alpha[i];pixels[p+3]=v;if(v>0&&v<255)for(let k=0;k<3;k++)pixels[p+k]=Math.min(255,Math.round(pixels[p+k]*255/v));}
   c.putImageData(data,0,0);return a;
  }
  function paint(c,fn){if(art.failed)return;let saved=false;try{c.save();saved=true;fn();}catch(e){return;}finally{if(saved)try{c.restore();}catch(e){return;}}}
  function drawChase(c,opts){paint(c,()=>{
   const img=assets[opts.storm?'storm':'chase'];if(!img)return;
   const zoom=(opts.low?1.22:1.07)+Math.min(.04,opts.speed*.00015),scale=Math.max(1280/img.naturalWidth,579/img.naturalHeight)*zoom,dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
   const dx=640-opts.lateral*.05-dw/2,dy=Math.max(653-dh,Math.min(74,363.5-(opts.low?.68:.52)*dh-opts.pitch*26));
   c.translate(640,363.5);c.rotate(-opts.bank*.03);c.translate(-640,-363.5);c.drawImage(img,dx,dy,dw,dh);
  });}
  function drawCanyon(c,camX,storm){paint(c,()=>{
   const img=assets.canyon;if(!img)return;const scale=Math.max(1280/img.naturalWidth,800/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale,shift=camX*.045,off=((shift%dw)+dw)%dw;
   let tile=Math.floor(shift/dw)-1;for(let x=-off-dw;x<1280;x+=dw,tile++)c.drawImage(tile%2?assets.canyonFlipped:img,x,-30,dw,dh);
   if(storm){c.fillStyle='rgba(24,40,50,.48)';c.fillRect(0,0,1280,800);}
  });}
  for(const [name,file] of Object.entries({chase:'plate-chase.jpg',storm:'plate-storm.jpg',canyon:'plate-canyon.jpg',planeRear:'plane-rear.webp',planeSide:'plane-side.webp'})){
   const img=new Image();img.onload=()=>{try{
    if(name==='planeRear'||name==='planeSide'){
     try{assets[name]=key(img);art[name]=assets[name];}
     catch(e){const fallback=new Image();fallback.onload=()=>{assets[name]=fallback;art[name]=assets[name];};fallback.onerror=()=>{failed[name]=true;};fallback.src='assets/'+(name==='planeRear'?'plane-rear-keyed.webp':'plane-side-keyed.webp');}
    }
    else{if(name==='canyon'){const flipped=canvas(img.naturalWidth,img.naturalHeight),c=flipped.getContext('2d');c.translate(flipped.width,0);c.scale(-1,1);c.drawImage(img,0,0);assets.canyonFlipped=flipped;}assets[name]=img;}
   }catch(e){failed[name]=true;}};
   img.onerror=()=>{failed[name]=true;};img.src='assets/'+file;
  }
 }catch(e){RR.art={ready:()=>false,failed:true};}
})();
