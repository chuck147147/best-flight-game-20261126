/* World coordinates use metres rightward, and altitude upward. */
RR.missions=[
 {name:'RING RUN',tag:'01 / THE GOLDEN TRAIL',goal:'Thread all 8 rings, then bring her home.',length:6900,wind:7,fuel:100,color:'#f4bc60'},
 {name:'CANYON RESCUE',tag:'02 / A LIGHT IN THE VALLEY',goal:'Find the smoke. Land gently at Hiker’s Rest.',length:5100,wind:12,fuel:85,color:'#8ed1bc'},
 {name:'STORM DELIVERY',tag:'03 / PRECIOUS CARGO',goal:'Beat the gusts. Deliver before your fuel runs dry.',length:8500,wind:27,fuel:28,color:'#b9cfde'}
];
RR.World=class{
 constructor(mission=0,seed=7){this.mission=mission;this.seed=seed;this.spec=RR.missions[mission];this.end=this.spec.length;this.runways=[{x:0,w:600,h:95,fieldElevationFt:410,name:'ALDER FIELD',id:0},{x:this.end-600,w:750,h:130,fieldElevationFt:524.8,name:mission===1?'HIKER’S REST':'HIGH PASS STRIP',id:1}];this.rings=Array.from({length:8},(_,i)=>({x:950+i*700,y:300+Math.sin(i*1.2)*100,r:62,hit:false,miss:false}));this.rings.forEach(r=>{r.y=Math.max(r.y,this.ground(r.x)+100);});this.balloons=[{x:2550,y:390},{x:4400,y:340},{x:6100,y:430}];}
 raw(x){return 90+Math.sin(x*.0022)*45+Math.sin(x*.006+1)*30+Math.max(0,Math.sin((x-1400)*.003))*100;}
 ground(x){let h=this.raw(x);for(const r of this.runways){let d=x<r.x?r.x-x:x>r.x+r.w?x-r.x-r.w:0;if(d<220)h=r.h+(h-r.h)*d/220;}return h;}
 // A shared MSL datum preserves the existing metre-based flight and terrain coordinates.
 mslFeet(y){const origin=this.runways[0];return origin.fieldElevationFt+(y-origin.h)*3.28;}
 runway(x){return this.runways.find(r=>x>=r.x&&x<=r.x+r.w);}
 wind(x,t){return Math.sin(t*.8+x*.001)*this.spec.wind+Math.sin(t*2.7)*this.spec.wind*.35;}
 draw(ctx,cam,t){
  const c=ctx,sy=y=>560-(y-cam.y),sx=x=>x-cam.x;
  const hash=n=>{const h=Math.sin((n+this.seed)*127.1)*43758.5453;return h-Math.floor(h);};
  const storm=this.mission===2,sunX=1020-cam.x*.018;
  const sky=c.createLinearGradient(0,0,0,660);for(const [p,color] of [[0,storm?'#344752':'#6ea7ab'],[.45,storm?'#657e7d':'#a9c9b2'],[.78,storm?'#a0b0a6':'#f3cf9c'],[1,storm?'#c5cdca':'#ffedb9']])sky.addColorStop(p,color);c.fillStyle=sky;c.fillRect(0,0,1280,800);
  for(const [r,a] of [[200,storm?.12:.5],[115,storm?.08:.55]]){const g=c.createRadialGradient(sunX,153,0,sunX,153,r),rgb=storm?'200,214,208':'255,227,160';g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(sunX-r,153-r,r*2,r*2);}
  const sun=c.createLinearGradient(0,108,0,198);sun.addColorStop(0,'#fff3c4');sun.addColorStop(1,'#ffd98c');c.fillStyle=storm?'rgba(216,223,216,.16)':sun;c.beginPath();c.arc(sunX,153,storm?69:45,0,Math.PI*2);c.fill();
  if(storm){for(let i=0;i<3;i++)RR.fx.cloud(c,140+i*420-cam.x*.008,85+i*33,680,152,'dark',.55,i);}
  else{for(let i=0;i<5;i++){const x=((i*247-cam.x*.08+t*3)%1700+1700)%1700-180;RR.fx.cloud(c,x,78+(i%3)*51,260+i*50,110,'warm',.5,i);}for(let i=0;i<2;i++)RR.fx.cloud(c,420+i*550-cam.x*.025,100+i*55,300,75,'cool',.3,i+9);}
  const colors=[['#b5c3b7','#ccd0bc','#bec9b9'],['#8aa5a2','#b5c2b5','#a0b4ac'],['#618f91','#91b0a9','#79a09d'],['#326f77','#528c8c','#427e82']];
  colors.forEach((col,l)=>{const par=l===0?.05:.11+(l-1)*.12,spacing=l===0?340:310-(l-1)*30,base=465+l*40,shift=cam.x*par;
   const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
   for(let i=Math.floor(shift/spacing)-2;i<Math.floor(shift/spacing)+7;i++){const x=i*spacing-shift,peak=120+l*45+Math.sin(i*2.7+this.seed)*65,px=x+spacing*.32;
    poly([[x-spacing*.7,base],[px,peak],[x+spacing*1.2,base]],col[0]);
    poly([[px,peak],[x-spacing*.1,base],[x+spacing*.56,base]],col[2]);
    poly([[px,peak],[x+spacing*.56,base],[x+spacing*1.2,base]],col[1]);
    if(l<3){for(const side of [-1,1]){const points=[[px,peak]];for(let k=0;k<7;k++)points.push([px+side*(spacing*.16-k*spacing*.023),peak+70+(k%2)*12+hash(i*31+l*7+k)*14]);poly(points,side>0?'#f8f1dc':'#aec6bc');}for(let k=0;k<2;k++){const qx=px+35+k*24,qy=peak+82+k*24;poly([[qx,qy],[qx+15,qy+8],[qx+7,qy+13],[qx-5,qy+6]],'#f8f1dc');}}
    c.strokeStyle=`rgba(255,232,170,${l===3?.5:.3})`;c.lineWidth=2;c.beginPath();c.moveTo(px,peak);c.lineTo(x+spacing*1.2,base);c.stroke();
   }
   if(RR.fx.mist){c.save();c.globalAlpha=.28-l*.04;c.drawImage(RR.fx.mist,0,base-80,1280,100);c.restore();}
  });
  // River beneath the foreground bank: changing width gives a winding valley.
  c.fillStyle='#79b8b4';c.beginPath();c.moveTo(0,540);for(let x=0;x<=1280;x+=30)c.lineTo(x,550+Math.sin((x+cam.x*.55)*.006)*27);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.save();c.strokeStyle='rgba(255,244,205,.35)';c.shadowColor=c.strokeStyle;c.shadowBlur=6;c.lineWidth=5;c.beginPath();for(let x=0;x<=1280;x+=30)c.lineTo(x,560+Math.sin((x+cam.x*.55)*.006)*27);c.stroke();c.restore();
  for(let x=0;x<1280;x+=8){const y=550+Math.sin((x+cam.x*.55)*.006)*27,g=c.createLinearGradient(0,y,0,y+12);g.addColorStop(0,'rgba(20,50,50,.18)');g.addColorStop(1,'rgba(20,50,50,0)');c.fillStyle=g;c.fillRect(x,y,8,12);}
  c.strokeStyle='#d7dfb17d';c.lineWidth=2;for(let i=0;i<24;i++){let x=((i*111-cam.x*.6+t*12)%1400+1400)%1400;c.beginPath();c.moveTo(x,585+(i%4)*19);c.lineTo(x+37,585+(i%4)*19);c.stroke();}
  for(let n=0;n<220;n++){const wx=(Math.floor(cam.x*.55/8)+n)*8,x=wx-cam.x*.55,y=560+Math.sin(wx*.006)*27+hash(n+23)*10,size=1+hash(n+71)*1.5;c.fillStyle=`rgba(${n%2?'255,246,214':'255,205,120'},${.3+hash(wx)*.6})`;c.fillRect(x,y,size,size*.65);}
  // Solid ground is sampled from exactly the same height function as collisions.
  const soil=c.createLinearGradient(0,350,0,800);soil.addColorStop(0,'#1e5c5e');soil.addColorStop(1,'#0c3036');c.fillStyle=soil;c.beginPath();c.moveTo(-20,800);for(let x=-20;x<=1300;x+=10)c.lineTo(x,sy(this.ground(x+cam.x)));c.lineTo(1300,800);c.fill();
  for(let i=Math.floor(cam.x/37)-1;i<(cam.x+1300)/37;i++){const hash=Math.sin(i*127.1)*43758.5453,f=hash-Math.floor(hash),wx=i*37,x=sx(wx),y=sy(this.ground(wx)),len=8+f*18,offset=6+f*64;c.strokeStyle=i%2?'rgba(255,240,200,.09)':'rgba(0,0,0,.18)';c.lineWidth=2+f;c.beginPath();c.moveTo(x,y+offset);c.lineTo(x+len,y+offset+(sy(this.ground(wx+10))-y)*len/10);c.stroke();}
  c.strokeStyle='rgba(4,20,22,.16)';c.lineWidth=10;c.beginPath();for(let x=-20;x<=1300;x+=10)c.lineTo(x,sy(this.ground(x+cam.x))+14);c.stroke();
  c.strokeStyle='#70a28c';c.lineWidth=5;c.beginPath();for(let x=-20;x<=1300;x+=10)c.lineTo(x,sy(this.ground(x+cam.x)));c.stroke();
  for(let i=Math.floor(cam.x/73)-1;i<(cam.x+1300)/73;i++){const wx=i*73+Math.sin(i*2)*19;if(this.runway(wx)||this.runways.some(r=>Math.abs(wx-r.x)<65))continue;let x=sx(wx),y=sy(this.ground(wx)),h=23+(Math.sin(i*7)+1)*15;if(RR.fx.shade)c.drawImage(RR.fx.shade,x-32,y-12,64,22);for(let k=0;k<1+Math.floor(hash(i)*3);k++){const cx=wx+(k%2?-1:1)*(12+hash(i*7+k)*15);if(this.runway(cx))continue;const qx=sx(cx),qy=sy(this.ground(cx)),qh=h*(.45+hash(i*31+k)*.3);c.fillStyle=k%2?'#1d4a44':'#265449';c.beginPath();c.moveTo(qx,qy-qh-8);c.lineTo(qx-qh*.3,qy-3);c.lineTo(qx+qh*.3,qy-3);c.fill();}c.save();c.globalAlpha=.85;c.fillStyle='#2f7263';c.beginPath();c.moveTo(x+3,y-h-16);c.lineTo(x-10,y-8);c.lineTo(x+16,y-8);c.fill();c.restore();c.fillStyle=i%3===0?'#103e46':'#225d5c';c.fillRect(x-2,y-h,4,h);c.beginPath();c.moveTo(x,y-h-15);c.lineTo(x-13,y-7);c.lineTo(x+13,y-7);c.fill();}
  // Geological seams make the low canyon read as rock rather than a flat floor.
  c.strokeStyle='#38736d66';c.lineWidth=2;for(let j=0;j<3;j++){c.beginPath();for(let x=0;x<=1280;x+=20)c.lineTo(x,sy(this.ground(x+cam.x))+55+j*43+Math.sin(x*.014+j)*10);c.stroke();}
  c.strokeStyle='rgba(112,162,140,.18)';c.lineWidth=1;for(let j=0;j<3;j++){c.beginPath();for(let x=0;x<=1280;x+=20)c.lineTo(x,sy(this.ground(x+cam.x))+72+j*43+Math.sin(x*.014+j)*10);c.stroke();}
  // A turquoise channel follows the valley floor, visible between the near banks.
  const riverY=x=>sy(this.ground(x+cam.x))+84+Math.sin((x+cam.x)*.004)*20;
  c.fillStyle='#61aaa2';c.beginPath();for(let x=-20;x<=1300;x+=20)c.lineTo(x,riverY(x));for(let x=1300;x>=-20;x-=20)c.lineTo(x,riverY(x)+28+Math.sin((x+cam.x)*.003)*12);c.closePath();c.fill();
  c.strokeStyle='rgba(190,230,210,.22)';c.lineWidth=6;c.beginPath();for(let x=-20;x<=1300;x+=20)c.lineTo(x,riverY(x));c.stroke();
  c.strokeStyle='rgba(215,240,215,.5)';c.lineWidth=2;c.beginPath();for(let x=-20;x<=1300;x+=20)c.lineTo(x,riverY(x));c.stroke();
  c.strokeStyle='#b2d5b655';c.lineWidth=1;for(let i=0;i<18;i++){let x=((i*91-cam.x*.7+t*9)%1360+1360)%1360-40,y=riverY(x)+12;c.beginPath();c.moveTo(x,y);c.lineTo(x+22,y-2);c.stroke();}
  for(let n=0;n<240;n++){const wx=(Math.floor(cam.x/6)+n)*6,x=wx-cam.x,y=riverY(x)+2+hash(wx)*10,size=1+hash(wx+71)*1.5;c.fillStyle=`rgba(${n%2?'255,246,214':'255,205,120'},${.3+hash(wx+12)*.6})`;c.fillRect(x,y,size,size*.65);}
  for(const r of this.runways){let x=sx(r.x),y=sy(r.h);if(x>1300||x+r.w<0)continue;const strip=c.createLinearGradient(0,y-3,0,y+6);strip.addColorStop(0,'#e8c887');strip.addColorStop(1,'#d9b26e');c.fillStyle=strip;c.fillRect(x,y-3,r.w,9);c.fillStyle='#314e4b';c.fillRect(x,y+6,r.w,12);c.fillStyle='#ffe3a1';for(let a=15;a<r.w;a+=54)c.fillRect(x+a,y,25,2);c.fillStyle='#ffce75';c.fillRect(x+25,y-70,3,68);c.beginPath();c.moveTo(x+28,y-70);c.lineTo(x+77,y-60+Math.sin(t*3)*4);c.lineTo(x+28,y-55);c.fill();c.font='bold 12px monospace';c.fillText(r.name,x+95,y-22);for(let a=0;a<=r.w;a+=60){c.save();c.fillStyle='#ffe9a8';c.shadowColor='#ffdf94';c.shadowBlur=7;c.beginPath();c.arc(x+a+2,y-4.5,2.5,0,7);c.fill();c.restore();}c.fillStyle='#fff3d6';c.fillRect(x,y-2,10,3);c.fillRect(x+r.w-10,y-2,10,3);if(r.id===1&&this.mission===1){for(let j=0;j<7;j++){c.fillStyle=`rgba(241,170,103,${.4-j*.045})`;c.beginPath();c.arc(x+140+Math.sin(j+t)*13,y-35-j*24,12+j*3,0,7);c.fill();}c.fillStyle='#f2b457';c.fillRect(x+137,y-23,6,17);c.beginPath();c.arc(x+140,y-27,4,0,7);c.fill();}}
  if(this.mission===0)for(let i=0;i<this.rings.length;i++){const r=this.rings[i],x=sx(r.x),y=sy(r.y);if(x< -90||x>1380)continue;c.save();c.translate(x,y);c.strokeStyle=r.hit?'#8cd6b5':'#ffc56b';c.lineWidth=9;c.shadowColor='#ffc56b';c.shadowBlur=r.hit?0:19;c.beginPath();c.ellipse(0,0,23,r.r,0,0,7);c.stroke();c.shadowBlur=0;c.strokeStyle='#fff3be';c.lineWidth=2;c.beginPath();c.ellipse(-3,-2,23,r.r-3,0,Math.PI,Math.PI*2);c.stroke();c.fillStyle='#123e44';c.beginPath();c.arc(0,-r.r-24,15,0,7);c.fill();c.fillStyle='#ffe3a0';c.font='bold 13px monospace';c.textAlign='center';c.fillText(String(i+1).padStart(2,'0'),0,-r.r-19);c.restore();}
  for(const b of this.balloons){let x=sx(b.x),y=sy(b.y+Math.sin(t*.6+b.x)*12);if(x< -50||x>1330)continue;const envelope=c.createLinearGradient(0,y-30,0,y+30);envelope.addColorStop(0,'#c97e64');envelope.addColorStop(1,'#a85f4c');c.fillStyle=envelope;c.beginPath();c.ellipse(x,y,23,30,0,0,7);c.fill();c.fillStyle='#f3c98c';c.beginPath();c.ellipse(x,y,9,30,0,0,7);c.fill();c.fillStyle='rgba(255,240,210,.35)';c.beginPath();c.ellipse(x-10,y-14,5,10,-.3,0,7);c.fill();c.strokeStyle='#e1bc86';c.lineWidth=1;c.beginPath();c.moveTo(x-10,y+25);c.lineTo(x-6,y+43);c.lineTo(x+6,y+43);c.lineTo(x+10,y+25);c.stroke();c.fillStyle='#775347';c.fillRect(x-7,y+39,14,9);}
  c.strokeStyle='#264f54';c.lineWidth=2;for(let i=0;i<6;i++){let x=((i*87+650-cam.x*.3+t*19)%1450+1450)%1450,y=155+Math.sin(i*2)*30;c.beginPath();c.moveTo(x-7,y-3);c.quadraticCurveTo(x-3,y-8-Math.sin(t*5+i)*4,x,y);c.quadraticCurveTo(x+4,y-8-Math.sin(t*5+i)*4,x+9,y-3);c.stroke();}
  if(this.mission===2){c.strokeStyle='#e9e4ce55';c.lineWidth=1;for(let i=0;i<75;i++){let x=((i*73-t*250)%1340+1340)%1340,y=(i*47+t*50)%640;c.beginPath();c.moveTo(x,y);c.lineTo(x-32,y+12);c.stroke();}}
 }
};
