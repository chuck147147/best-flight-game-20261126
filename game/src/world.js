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
  let sky=c.createLinearGradient(0,0,0,660);sky.addColorStop(0,this.mission===2?'#6b8f9b':'#87b5b7');sky.addColorStop(.55,'#efd1a3');sky.addColorStop(1,'#ffe5ad');c.fillStyle=sky;c.fillRect(0,0,1280,800);
  c.fillStyle='#f9dfaa';c.beginPath();c.arc(1020-cam.x*.018,153,69,0,Math.PI*2);c.fill();c.strokeStyle='#f7dfad55';c.lineWidth=20;c.stroke();
  // Quiet bands of cloud and three individually faceted mountain ranges.
  for(let i=0;i<9;i++){let x=((i*247-cam.x*.08+t*3)%1700+1700)%1700-180,y=78+(i%3)*51;c.fillStyle='#fff2d24a';c.beginPath();c.ellipse(x,y,75+(i%2)*45,8,0,0,7);c.fill();}
  const colors=[['#8aa5a2','#b5c2b5'],['#618f91','#91b0a9'],['#326f77','#528c8c']];
  colors.forEach((col,l)=>{let par=.11+l*.12,spacing=310-l*30,base=505+l*40,shift=cam.x*par;for(let i=Math.floor(shift/spacing)-2;i<Math.floor(shift/spacing)+7;i++){let x=i*spacing-shift,peak=165+l*45+Math.sin(i*2.7+this.seed)*65;c.fillStyle=col[0];c.beginPath();c.moveTo(x-spacing*.7,base);c.lineTo(x+spacing*.32,peak);c.lineTo(x+spacing*1.2,base);c.fill();c.fillStyle=col[1];c.beginPath();c.moveTo(x+spacing*.32,peak);c.lineTo(x+spacing*.56,base);c.lineTo(x+spacing*1.2,base);c.fill();if(l<2){c.fillStyle=l===0?'#edf0d9':'#d0dccc';c.beginPath();c.moveTo(x+spacing*.32,peak);c.lineTo(x+spacing*.11,peak+65);c.lineTo(x+spacing*.27,peak+52);c.lineTo(x+spacing*.36,peak+73);c.lineTo(x+spacing*.43,peak+45);c.lineTo(x+spacing*.52,peak+69);c.fill();}}});
  // River beneath the foreground bank: changing width gives a winding valley.
  c.fillStyle='#79b8b4';c.beginPath();c.moveTo(0,540);for(let x=0;x<=1280;x+=30)c.lineTo(x,550+Math.sin((x+cam.x*.55)*.006)*27);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.strokeStyle='#d7dfb17d';c.lineWidth=2;for(let i=0;i<24;i++){let x=((i*111-cam.x*.6+t*12)%1400+1400)%1400;c.beginPath();c.moveTo(x,585+(i%4)*19);c.lineTo(x+37,585+(i%4)*19);c.stroke();}
  // Solid ground is sampled from exactly the same height function as collisions.
  c.fillStyle='#184e52';c.beginPath();c.moveTo(-20,800);for(let x=-20;x<=1300;x+=10)c.lineTo(x,sy(this.ground(x+cam.x)));c.lineTo(1300,800);c.fill();
  c.strokeStyle='#70a28c';c.lineWidth=5;c.beginPath();for(let x=-20;x<=1300;x+=10)c.lineTo(x,sy(this.ground(x+cam.x)));c.stroke();
  for(let i=Math.floor(cam.x/73)-1;i<(cam.x+1300)/73;i++){const wx=i*73+Math.sin(i*2)*19;if(this.runway(wx)||this.runways.some(r=>Math.abs(wx-r.x)<65))continue;let x=sx(wx),y=sy(this.ground(wx)),h=23+(Math.sin(i*7)+1)*15;c.fillStyle=i%3===0?'#103e46':'#225d5c';c.fillRect(x-2,y-h,4,h);c.beginPath();c.moveTo(x,y-h-15);c.lineTo(x-13,y-7);c.lineTo(x+13,y-7);c.fill();}
  // Geological seams make the low canyon read as rock rather than a flat floor.
  c.strokeStyle='#38736d66';c.lineWidth=2;for(let j=0;j<3;j++){c.beginPath();for(let x=0;x<=1280;x+=20)c.lineTo(x,sy(this.ground(x+cam.x))+55+j*43+Math.sin(x*.014+j)*10);c.stroke();}
  // A turquoise channel follows the valley floor, visible between the near banks.
  const riverY=x=>sy(this.ground(x+cam.x))+84+Math.sin((x+cam.x)*.004)*20;
  c.fillStyle='#4e9492';c.beginPath();for(let x=-20;x<=1300;x+=20)c.lineTo(x,riverY(x));for(let x=1300;x>=-20;x-=20)c.lineTo(x,riverY(x)+28+Math.sin((x+cam.x)*.003)*12);c.closePath();c.fill();
  c.strokeStyle='#97c3ab';c.lineWidth=2;c.beginPath();for(let x=-20;x<=1300;x+=20)c.lineTo(x,riverY(x));c.stroke();
  c.strokeStyle='#b2d5b655';c.lineWidth=1;for(let i=0;i<18;i++){let x=((i*91-cam.x*.7+t*9)%1360+1360)%1360-40,y=riverY(x)+12;c.beginPath();c.moveTo(x,y);c.lineTo(x+22,y-2);c.stroke();}
  for(const r of this.runways){let x=sx(r.x),y=sy(r.h);if(x>1300||x+r.w<0)continue;c.fillStyle='#e0bc7d';c.fillRect(x,y-3,r.w,9);c.fillStyle='#314e4b';c.fillRect(x,y+6,r.w,12);c.fillStyle='#ffe3a1';for(let a=15;a<r.w;a+=54)c.fillRect(x+a,y,25,2);c.fillStyle='#ffce75';c.fillRect(x+25,y-70,3,68);c.beginPath();c.moveTo(x+28,y-70);c.lineTo(x+77,y-60+Math.sin(t*3)*4);c.lineTo(x+28,y-55);c.fill();c.font='bold 12px monospace';c.fillText(r.name,x+95,y-22);for(let a=0;a<=r.w;a+=60){c.fillStyle='#ffe29a';c.fillRect(x+a,y-7,4,5);}if(r.id===1&&this.mission===1){for(let j=0;j<7;j++){c.fillStyle=`rgba(241,170,103,${.4-j*.045})`;c.beginPath();c.arc(x+140+Math.sin(j+t)*13,y-35-j*24,12+j*3,0,7);c.fill();}c.fillStyle='#f2b457';c.fillRect(x+137,y-23,6,17);c.beginPath();c.arc(x+140,y-27,4,0,7);c.fill();}}
  if(this.mission===0)for(let i=0;i<this.rings.length;i++){const r=this.rings[i],x=sx(r.x),y=sy(r.y);if(x< -90||x>1380)continue;c.save();c.translate(x,y);c.strokeStyle=r.hit?'#8cd6b5':'#ffc56b';c.lineWidth=9;c.shadowColor='#ffc56b';c.shadowBlur=r.hit?0:19;c.beginPath();c.ellipse(0,0,23,r.r,0,0,7);c.stroke();c.shadowBlur=0;c.strokeStyle='#fff3be';c.lineWidth=2;c.beginPath();c.ellipse(-3,-2,23,r.r-3,0,Math.PI,Math.PI*2);c.stroke();c.fillStyle='#123e44';c.beginPath();c.arc(0,-r.r-24,15,0,7);c.fill();c.fillStyle='#ffe3a0';c.font='bold 13px monospace';c.textAlign='center';c.fillText(String(i+1).padStart(2,'0'),0,-r.r-19);c.restore();}
  for(const b of this.balloons){let x=sx(b.x),y=sy(b.y+Math.sin(t*.6+b.x)*12);if(x< -50||x>1330)continue;c.fillStyle='#bc7660';c.beginPath();c.ellipse(x,y,23,30,0,0,7);c.fill();c.fillStyle='#f3c98c';c.beginPath();c.ellipse(x,y,9,30,0,0,7);c.fill();c.strokeStyle='#e1bc86';c.lineWidth=1;c.beginPath();c.moveTo(x-10,y+25);c.lineTo(x-6,y+43);c.lineTo(x+6,y+43);c.lineTo(x+10,y+25);c.stroke();c.fillStyle='#775347';c.fillRect(x-7,y+39,14,9);}
  c.strokeStyle='#264f54';c.lineWidth=2;for(let i=0;i<6;i++){let x=((i*87+650-cam.x*.3+t*19)%1450+1450)%1450,y=155+Math.sin(i*2)*30;c.beginPath();c.moveTo(x-7,y-3);c.quadraticCurveTo(x-3,y-8-Math.sin(t*5+i)*4,x,y);c.quadraticCurveTo(x+4,y-8-Math.sin(t*5+i)*4,x+9,y-3);c.stroke();}
  if(this.mission===2){c.strokeStyle='#e9e4ce55';c.lineWidth=1;for(let i=0;i<55;i++){let x=((i*73-t*250)%1340+1340)%1340,y=(i*47+t*50)%640;c.beginPath();c.moveTo(x,y);c.lineTo(x-22,y+8);c.stroke();}}
 }
};
