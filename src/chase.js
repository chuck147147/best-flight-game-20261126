/* Perspective valley flight. Metres in world space, a trailing camera in screen space. */
RR.Chase=class{
 constructor(spec,mission){
  this.spec=spec;this.mission=mission;this.end=spec.length;this.z=125;this.lateral=0;this.altitude=8;this.speed=0;this.throttle=.18;this.fuel=spec.fuel;this.hp=100;this.boost=100;this.bank=0;this.pitch=0;this.sink=0;this.grounded=true;this.stall=false;this.invincible=0;this.time=0;
  this.rings=Array.from({length:8},(_,i)=>({x:950+i*700,lateral:[-95,130,-150,75,-120,90,-145,125][i],y:[100,260,155,280,85,180,270,105][i],r:62,hit:false}));
  this.runways=[{x:0,w:600,id:0,name:'ALDER FIELD',fieldElevationFt:410},{x:this.end-600,w:750,id:1,name:mission===1?'HIKER’S REST':'HIGH PASS STRIP',fieldElevationFt:410}];
  this.planeFacade={};this.worldFacade={spec,mission,end:this.end,rings:this.rings,runways:this.runways,ground:()=>0,runway:x=>this.runwayAt(x),mslFeet:y=>410+y*3.28,wind:(x,t)=>this.hudWindAt(x,t)};
 }
 runwayAt(z){return Math.abs(this.lateral)<48?this.runways.find(r=>z>=r.x&&z<=r.x+r.w):undefined;}
 // Report prevailing wind plus gusts; instantaneous crosswind can pass through zero.
 hudWindAt(z,t){return this.spec.wind*(.52+Math.sin(t*.8+z*.001)*.12+Math.sin(t*2.7)*.08);}
 windAt(z,t){return Math.sin(t*.8+z*.001)*this.spec.wind+Math.sin(t*2.7)*this.spec.wind*.35;}
 damage(amount,g){if(this.invincible>0)return;this.hp=Math.max(0,this.hp-amount);this.invincible=1.6;g.shake=10;g.message='HARD HIT · CHECK AIRFRAME';g.messageTime=2.5;RR.audio.hit();}
 update(dt,g){
  const i=RR.input,steer=Number(i.held('d'))-Number(i.held('a')),climb=Number(i.held('arrowup'))-Number(i.held('arrowdown'));this.time=g.time;
  const powerInput=Number(i.held('w'))-Number(i.held('s'));
  this.throttle=Math.max(0,Math.min(1,this.throttle+powerInput*dt*.35));
  if(i.drag)this.throttle=Math.max(0,Math.min(1,(770-i.pointer.y)/84));
  if(!this.fuel)this.throttle=0;
  this.boosting=i.held(' ')&&this.boost>0&&this.fuel>0&&!this.grounded;this.boost=Math.max(0,Math.min(100,this.boost+(this.boosting?-42:12)*dt));this.fuel=Math.max(0,this.fuel-dt*(.12+this.throttle*.4+(this.boosting?.6:0)));
  this.bank+=(steer*.48-this.bank)*Math.min(1,dt*4);this.pitch+=(climb*.38-this.pitch)*Math.min(1,dt*3);
  this.speed=Math.max(0,this.speed+dt*(this.throttle*49+(this.boosting?65:0)-this.speed*.19-Math.abs(this.pitch)*10));
  const previousZ=this.z;this.z+=this.speed*dt;this.invincible=Math.max(0,this.invincible-dt);
  this.stall=!this.grounded&&this.speed<58;
  const gust=this.windAt(this.z,g.time);this.lateral+=(this.bank*this.speed*.8+(this.grounded?0:gust*.2))*dt;
  if(this.grounded){this.altitude=8;this.sink=0;if(this.speed>72&&climb>0){this.grounded=false;this.sink=10;}else if(!this.runwayAt(this.z))this.grounded=false;if(this.throttle<.32)this.speed=Math.max(0,this.speed-35*dt);}
  else{let desired=climb*this.speed*.36+(this.speed-110)*.035+(this.mission===2?gust*.13:0)-(this.stall?45:0);this.sink+=(desired-this.sink)*Math.min(1,dt*2);this.altitude+=this.sink*dt;
   if(this.altitude<=8){const strip=this.runwayAt(this.z);if(strip&&Math.abs(this.sink)<20&&this.speed<150&&Math.abs(this.bank)<.2&&Math.abs(this.pitch)<.24){this.grounded=true;this.altitude=8;this.sink=0;g.score+=350;g.message='CLEAN TOUCHDOWN  +350';g.messageTime=4;RR.audio.ring();if(strip.id===1){if(this.mission!==0||g.rings===8)g.finish(true);else g.finish(false,'You missed a ring. Follow the golden trail.');}}else{this.damage(32+Math.abs(this.sink)*.65,g);this.altitude=16;this.sink=30;this.speed*=.7;}}
  }
  if(Math.abs(this.lateral)>470&&this.altitude<310){this.damage(28,g);this.lateral=Math.sign(this.lateral)*465;this.bank*=-.5;}
  if(this.altitude>650){this.altitude=650;this.sink=Math.min(0,this.sink);}
  for(const r of this.rings)if(!r.hit&&previousZ<=r.x&&this.z>=r.x&&Math.hypot(this.lateral-r.lateral,this.altitude-r.y)<r.r-8){r.hit=true;g.rings++;g.score+=200;g.message=`RING ${g.rings} / 8  +200`;g.messageTime=2;RR.audio.ring();}
  if(this.hp<=0)g.finish(false,'The canyon won this round. Give the ridge more room.');
  if(this.z>this.end+450)g.finish(false,'Strip missed. Slow down and descend earlier.');
  if(!this.fuel&&this.speed<25)g.finish(false,'Out of fuel. Use a steady cruise throttle.');
 }
 projectPoint(x,y,z){const depth=z-this.z+230,scale=520/Math.max(12,depth);return{x:640+(x-this.lateral)*scale,y:300+(this.altitude+65-y)*scale,scale};}
 polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
 worldPolygon(c,points,color){this.polygon(c,points.map(p=>this.projectPoint(...p)),color);}
 drawSky(c){const storm=this.mission===2,sky=c.createLinearGradient(0,74,0,580);
  for(const [p,color] of [[0,storm?'#243640':'#3f747e'],[.4,storm?'#52666b':'#8fae9d'],[.75,storm?'#6a7b78':'#d9c49c'],[1,storm?'#89958a':'#f4d9a4']])sky.addColorStop(p,color);c.fillStyle=sky;c.fillRect(0,0,1280,800);
  for(const [r,a] of [[520,storm?.045:.24],[320,storm?.14:.5],[150,storm?.09:.5]]){const g=c.createRadialGradient(950,242,0,950,242,r),rgb=storm?'200,214,208':r===520?'255,214,150':'255,231,170';g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(950-r,242-r,r*2,r*2);}
  const sun=c.createLinearGradient(0,208,0,276);sun.addColorStop(0,'#fff2c0');sun.addColorStop(1,'#ffd488');c.fillStyle=storm?'rgba(150,170,163,.16)':sun;c.beginPath();c.arc(950,242,34,0,7);c.fill();
  if(storm){RR.fx.cloud(c,140,110,430,80,'dark',.45,11);RR.fx.cloud(c,1140,105,430,80,'dark',.45,37);}
  else{RR.fx.cloud(c,600,65,1100,170,'cool',.16,41);RR.fx.cloud(c,180,105,560,120,'warm',.5,11);RR.fx.cloud(c,640,145,760,170,'warm',.5,23);RR.fx.cloud(c,1080,185,620,140,'warm',.5,37);RR.fx.cloud(c,780,235,420,90,'cool',.22,29);}
 }
 drawFarMountains(c){
  for(let far=0;far<2;far++){const base=318+far*16;for(let n=-1;n<6;n++){const x=n*280-this.lateral*(.012+far*.008),peak=167+far*14+Math.sin(n*2.1+far)*30;this.polygon(c,[{x:x-180,y:base},{x:x+85,y:peak},{x:x+350,y:base}],far?'#a4b6ac':'#bec8b7');}if(RR.fx.mist){c.save();c.globalAlpha=.30-far*.025;c.drawImage(RR.fx.mist,0,base-35,1280,70);c.restore();}}
  for(let layer=0;layer<3;layer++){const base=350+layer*20,spacing=310+layer*80;for(let n=-1;n<5;n++){const x=n*spacing-this.lateral*(.03+layer*.035),peak=190+layer*30+Math.sin(n*2.1+layer)*42;
   this.polygon(c,[{x:x-200,y:base},{x:x+100,y:peak},{x:x+370,y:base}],['#8da6a0','#678e8c','#3d7075'][layer]);this.polygon(c,[{x:x+100,y:peak},{x:x-30,y:base},{x:x+180,y:base}],['#9fb1a8','#789891','#497a7b'][layer]);this.polygon(c,[{x:x+100,y:peak},{x:x+180,y:base},{x:x+370,y:base}],['#b1bbb0','#88a29a','#548480'][layer]);
   if(layer<2){for(const side of [-1,1]){const points=[{x:x+100,y:peak}];for(let k=0;k<7;k++){const jitter=Math.sin((n*31+layer*7+k)*127.1)*.5+.5;points.push({x:x+100+side*(58-k*8),y:peak+Math.max(0,base-peak)*.18+(k%2?8:0)+jitter*9});}this.polygon(c,points,side>0?'#f8f1dc':'#aec6bc');}for(let k=0;k<2;k++){const px=x+139+k*24,py=peak+52+k*17;this.polygon(c,[{x:px,y:py},{x:px+12,y:py+7},{x:px+5,y:py+10},{x:px-6,y:py+6}],'#f8f1dc');}}
   if(layer>0){c.strokeStyle=`rgba(255,232,170,${layer===2?.4:.25})`;c.lineWidth=2;c.beginPath();c.moveTo(x+100,peak);c.lineTo(x+370,base);c.stroke();}}if(RR.fx.mist){c.save();c.globalAlpha=.24-layer*.04;c.drawImage(RR.fx.mist,0,base-30,1280,65);c.restore();}}
 }
 riverCentre(z){return -110+Math.sin(z*.0017)*100;}
 drawValleyFloor(c){
  c.fillStyle='#325b56';c.fillRect(0,365,1280,300);
  const depths=[];for(let d=20;d<5200;d+=Math.min(55,Math.max(4,d*.065)))depths.push(d);depths.push(5200);
  for(let j=depths.length-2;j>=0;j--){const a=this.z-200+depths[j],b=this.z-200+depths[j+1],h=Math.sin(j*127.1)*43758.5453;this.worldPolygon(c,[[-1600,0,a],[1600,0,a],[1600,0,b],[-1600,0,b]],['#3b6257','#406659','#386055'][Math.floor((h-Math.floor(h))*3)]);
   // Clip broad world-space fields to each depth strip so the river and slopes stay in front.
   for(const [x,z,w,length,color] of [[-350,900,190,480,'#41695d'],[210,2100,210,650,'#3d665b'],[-370,3300,230,720,'#548480'],[235,4600,185,560,'#41695d'],[-340,5550,190,650,'#548480'],[210,6300,230,580,'#3d665b']]){const near=Math.max(a,z),far=Math.min(b,z+length);if(near<far){c.save();c.globalAlpha=.30;this.worldPolygon(c,[[x+25*(near-z)/length,0,near],[x+w-35*(near-z)/length,0,near],[x+w-35*(far-z)/length,0,far],[x+25*(far-z)/length,0,far]],color);c.restore();}}
   for(const [x,z,w,length,color] of [[-290,1600,120,320,'#548480'],[260,3800,110,360,'#41695d'],[-380,4900,135,300,'#3d665b']]){const near=Math.max(a,z),far=Math.min(b,z+length);if(near<far){c.save();c.globalAlpha=.22;this.worldPolygon(c,[[x,0,near],[x+w,0,near],[x+w,0,far],[x,0,far]],color);c.restore();}}
   const ra=this.riverCentre(a),rb=this.riverCentre(b);this.worldPolygon(c,[[ra-34,1,a],[ra+34,1,a],[rb+34,1,b],[rb-34,1,b]],'#74b8ad');this.worldPolygon(c,[[ra+27,2,a],[ra+34,2,a],[rb+34,2,b],[rb+27,2,b]],'#a1b9a080');

  }
  for(let j=depths.length-2;j>=0;j--){const a=this.z-200+depths[j],b=this.z-200+depths[j+1],ra=this.riverCentre(a),rb=this.riverCentre(b);this.worldPolygon(c,[[ra-7,2,a],[ra+7,2,a],[rb+7,2,b],[rb-7,2,b]],'rgba(215,238,214,.46)');for(const side of [-1,1])this.worldPolygon(c,[[ra+side*36,1,a],[ra+side*48,1,a],[rb+side*48,1,b],[rb+side*36,1,b]],'rgba(8,28,30,.16)');}
  const hash=n=>{const h=Math.sin(n*127.1)*43758.5453;return h-Math.floor(h);};
  for(let j=0;j<depths.length-1;j++){const a=this.z-200+depths[j],b=this.z-200+depths[j+1],count=Math.min(24,Math.max(2,Math.floor(68*this.projectPoint(0,0,a).scale*.22)));for(let n=0;n<count;n++){const f=hash(j*97+n*13),z=a+(b-a)*f,centre=this.riverCentre(a)+(this.riverCentre(b)-this.riverCentre(a))*f,p=this.projectPoint(centre+(hash(j*31+n*71)-.5)*58,2,z),size=1+hash(n*17+j)*1.5;c.fillStyle=`rgba(${n%2?'255,246,214':'255,205,120'},${.35+hash(j*41+n)*.6})`;c.fillRect(p.x,p.y,size,size*.65);}}
  const nearDepths=depths.filter(d=>d<1100);for(let n=0;n<90;n++){const j=n%nearDepths.length,z=this.z-200+nearDepths[j],x=(hash(j*97+n*13)-.5)*900;if(Math.abs(x-this.riverCentre(z))<50)continue;const p=this.projectPoint(x,0,z);c.strokeStyle=n%2?'rgba(235,242,200,.06)':'rgba(0,0,0,.10)';c.lineWidth=Math.max(.5,p.scale);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+(3+hash(n+3)*5)*p.scale,p.y-2*p.scale);c.stroke();}
  // Continuous faces avoid antialiased seams between narrow depth tiles.
  for(const side of [-1,1]){const toe=[],ridge=[],crest=[];for(const d of depths){const z=this.z-200+d,h=290+Math.sin(z*.003)*65;toe.push([side*480,0,z]);ridge.push([side*950,h,z]);crest.push([side*1300,h+160,z]);}this.worldPolygon(c,[...ridge,...crest.slice().reverse()],side<0?'#21494e':'#355d58');this.worldPolygon(c,[...toe,...ridge.slice().reverse()],side<0?'#285454':'#426b62');
   const mid=toe.map((p,i)=>p.map((v,k)=>v+(ridge[i][k]-v)*.55));this.worldPolygon(c,[...mid,...ridge.slice().reverse()],side<0?'#2b5650':'#3a655c');
   for(const [i,offset] of [500,1300,2100].entries()){const p=this.projectPoint(side*720,150,this.z+offset),radius=260*p.scale+120,patch=c.createRadialGradient(p.x,p.y,0,p.x,p.y,radius),rgb=i%2?'255,240,200':'6,24,26';patch.addColorStop(0,`rgba(${rgb},${i%2?.06:.13})`);patch.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=patch;c.beginPath();c.arc(p.x,p.y,radius,0,Math.PI*2);c.fill();}
   c.strokeStyle='rgba(255,233,170,.34)';c.lineWidth=2;c.beginPath();crest.forEach((v,i)=>{const p=this.projectPoint(...v);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});c.stroke();
   for(let n=0;n<90;n++){const z=this.z+hash(n*73+side)*3000,f=hash(n*43+side),p=this.projectPoint(side*(490+f*440),(290+Math.sin(z*.003)*65)*f,z);c.fillStyle=n%2?'rgba(235,224,181,.055)':'rgba(6,28,29,.10)';c.fillRect(p.x,p.y,1+hash(n)*2,1);}
   const fog=toe.map((p,i)=>p.map((v,k)=>v+(ridge[i][k]-v)*.08));this.worldPolygon(c,[...toe,...fog.reverse()],'rgba(220,226,205,.07)');
  }
  for(let n=Math.ceil((this.z+2300)/146);n>=Math.floor((this.z-140)/146);n--){const z=n*146;if(z-this.z+230>=2600)continue;for(const side of [-1,1]){const x=n%3===0?this.riverCentre(z)+side*(60+hash(n)*45):side*(370+hash(n)*90),p=this.projectPoint(x,0,z),scale=[.65,1,1.35][Math.abs(n)%3];if(p.y>680)continue;if(RR.fx.shade)c.drawImage(RR.fx.shade,p.x-40*p.scale,p.y-6*p.scale,80*p.scale,16*p.scale);for(let k=0;k<5+Math.floor(hash(n+8)*5);k++){const q=this.projectPoint(x+(hash(n*31+k)-.5)*65,0,z+(hash(n*17+k)-.5)*30),h=(18+hash(n*47+k)*24)*q.scale*scale,w=h*.32;this.polygon(c,[{x:q.x,y:q.y-h},{x:q.x-w,y:q.y},{x:q.x+w,y:q.y}],['#173f3d','#1d4a44','#265449'][k%3]);}}}
  for(let n=Math.ceil((this.z+650)/146);n>=Math.floor((this.z-140)/146);n--){const z=n*146,hash=Math.sin(n*127.1)*43758.5453,f=hash-Math.floor(hash);for(const side of [-1,1]){const x=side*(170+f*280);const p=this.projectPoint(x,0,z),h=(19+f*16)*p.scale,w=h*.32;if(p.y>680)continue;this.polygon(c,[{x:p.x,y:p.y-h},{x:p.x-w,y:p.y},{x:p.x+w,y:p.y}],side<0?'#153f43':'#254f48');if(n%4===0){const r=this.projectPoint(x*.8,0,z+26);this.polygon(c,[{x:r.x-8*r.scale,y:r.y},{x:r.x-3*r.scale,y:r.y-7*r.scale},{x:r.x+7*r.scale,y:r.y}], '#718378');}}}
 }
 drawRunways(c){for(const r of this.runways){if(r.x+r.w<this.z-180||r.x-this.z>4200)continue;const start=Math.max(r.x,this.z-180),end=r.x+r.w;
   // Clip all markings to a single coplanar trapezoid, including at long range.
   c.save();this.worldPolygon(c,[[-48,2,start],[48,2,start],[48,2,end],[-48,2,end]],'#9b9d85');c.clip();this.worldPolygon(c,[[-48,2,start],[48,2,start],[48,2,end],[-48,2,end]],'rgba(255,244,200,.05)');
   for(const z of [r.x,end-5]){const near=Math.max(start,z),far=Math.min(end,z+5);if(near<far)this.worldPolygon(c,[[-44,2,near],[44,2,near],[44,2,far],[-44,2,far]],'rgba(238,224,178,.8)');}
   for(let z=r.x;z<end;z+=60){const near=Math.max(start,z),far=Math.min(end,z+26);if(near<far)this.worldPolygon(c,[[-2,2,near],[2,2,near],[2,2,far],[-2,2,far]],'#eee0b2');if(z<start)continue;for(const x of [-44,44]){const p=this.projectPoint(x,2,z);if(p.scale>.45){c.fillStyle='rgba(255,225,160,.16)';c.beginPath();c.arc(p.x,p.y,p.scale*5,0,7);c.fill();}c.fillStyle='#ffe1a0';c.beginPath();c.arc(p.x,p.y,Math.max(.65,p.scale*2),0,7);c.fill();}}
   c.restore();
  }
 }
 drawRingsAhead(c){
  const visible=this.rings.map((r,n)=>({r,n,d:r.x-this.z})).filter(({r,d})=>!r.hit&&d>=-25&&d<=3000).sort((a,b)=>a.d-b.d).slice(0,3).map((item,i)=>{const p=this.projectPoint(item.r.lateral,item.r.y,item.r.x),radius=item.r.r*p.scale;return {...item,p,radius,badgeY:p.y-radius-16,opacity:i===0?1:i===1?.58:.16};});
  for(let i=1;i<visible.length;i++){const ring=visible[i];if(visible.slice(0,i).some(near=>Math.hypot(near.p.x-ring.p.x,near.badgeY-ring.badgeY)<46))ring.opacity=Math.min(ring.opacity,.35);if(visible.slice(0,i).some(near=>Math.hypot(near.p.x-ring.p.x,near.p.y-ring.p.y)<near.radius+ring.radius+12))ring.opacity=0;}
  const nearest=visible[0];for(const ring of visible.reverse()){const {n,p,radius,opacity}=ring;c.save();if(ring===nearest){const halo=c.createRadialGradient(p.x,p.y,radius*.65,p.x,p.y,radius*1.35);halo.addColorStop(0,'rgba(255,214,150,0)');halo.addColorStop(.5,'rgba(255,214,150,.18)');halo.addColorStop(1,'rgba(255,214,150,0)');c.fillStyle=halo;c.fillRect(p.x-radius*1.35,p.y-radius*1.35,radius*2.7,radius*2.7);}c.globalAlpha=opacity;c.strokeStyle='#e7bc70';c.lineWidth=Math.max(2,5*p.scale);c.shadowColor=c.strokeStyle;c.shadowBlur=ring===nearest?12*opacity:0;c.beginPath();c.ellipse(p.x,p.y,radius,radius,0,0,7);c.stroke();c.shadowBlur=0;if(ring===nearest){c.strokeStyle='rgba(255,243,207,.6)';c.lineWidth=Math.max(1,2*p.scale);c.beginPath();c.arc(p.x,p.y,Math.max(0,radius-2*p.scale),0,7);c.stroke();for(let k=0;k<16;k++){const f=Math.sin((n*31+k)*127.1)*43758.5453,u=f-Math.floor(f),a=(k+u*.6)/16*Math.PI*2,r=radius+(u-.5)*12;c.fillStyle=`rgba(${k%2?'255,243,207':'255,214,150'},${.3+u*.6})`;c.fillRect(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,1+u,1+u);}}c.strokeStyle='#f9e5b6';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,Math.max(0,radius-3),Math.PI,Math.PI*1.8);c.stroke();c.fillStyle='#21494b';c.beginPath();c.arc(p.x,p.y-radius-16,12,0,7);c.fill();c.fillStyle='#efd5a0';c.font='11px monospace';c.textAlign='center';c.fillText(String(n+1).padStart(2,'0'),p.x,p.y-radius-12);c.restore();}
 }
 drawChasePlane(c){
  const ground=this.projectPoint(this.lateral,0,this.z+30),fade=Math.max(0,1-this.altitude/400);c.save();c.translate(ground.x,ground.y);c.scale(80*fade+10,12*fade+2);const shadow=c.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,`rgba(8,30,34,${.30*fade})`);shadow.addColorStop(1,'rgba(8,30,34,0)');c.fillStyle=shadow;c.beginPath();c.ellipse(0,0,1,1,0,0,7);c.fill();c.restore();
  if(RR.art.ready('planeRear')){
   c.save();c.translate(640+this.bank*22,480+this.pitch*28);c.rotate(this.bank);const planeScale=1+Math.max(0,100-this.altitude)*.0015;c.scale(planeScale,planeScale);c.drawImage(RR.art.planeRear,-440*.5,-351*.52,440,351);
   for(const [x,color] of [[-173,'#d9826d'],[173,'#b9d6ac']]){c.fillStyle=color;c.shadowColor=color;c.shadowBlur=10;c.beginPath();c.arc(x*440/350,-25*440/350,3,0,7);c.fill();}c.restore();return;
  }
  c.save();c.translate(640+this.bank*22,480+this.pitch*28);c.rotate(this.bank);const planeScale=1+Math.max(0,100-this.altitude)*.0015;c.scale(planeScale,planeScale);const poly=(p,color)=>{this.polygon(c,p.map(([x,y])=>({x,y})),color);c.strokeStyle='#183b40';c.lineWidth=.8;c.stroke();};const body=c.createLinearGradient(0,-54,0,65);body.addColorStop(0,'#eee4c4');body.addColorStop(.45,'#e9bc73');body.addColorStop(1,'#b98e53');
  c.strokeStyle='#dce5cc18';c.lineWidth=5;c.beginPath();c.moveTo(10,-36);c.bezierCurveTo(30,-10,15,40,28,80);c.stroke();
  const prop=c.createRadialGradient(0,-62,0,0,-62,47);for(const [p,a] of [[0,.052],[.55,.104],[.85,.169],[1,0]])prop.addColorStop(p,`rgba(242,232,205,${a})`);c.fillStyle=prop;c.beginPath();c.arc(0,-62,47,0,7);c.fill();
  const phase=Math.sin(this.time*48)*.9;for(const angle of [phase,phase+Math.PI]){c.save();c.translate(0,-62);c.rotate(angle);c.fillStyle='rgba(240,230,200,.13)';c.beginPath();c.ellipse(0,0,44,5,0,0,7);c.fill();c.restore();}
  if(this.throttle>.5)for(let i=0;i<4;i++){const h=Math.sin(i*127.1)*43758.5453,x=(h-Math.floor(h)-.5)*12,y=70+i*20,r=8+i*5,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(206,196,168,${(this.throttle-.5)*.55*(1-i/4.5)})`);g.addColorStop(1,'rgba(206,196,168,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
  c.strokeStyle='#183b40';c.lineWidth=6;for(const s of [-1,1]){c.beginPath();c.moveTo(s*13,10);c.lineTo(s*26,40);c.stroke();c.fillStyle='#16343a';c.beginPath();c.ellipse(s*27,42,6,10,0,0,7);c.fill();}
  poly([[-18,-50],[18,-50],[24,-13],[8,65],[-8,65],[-24,-13]],body);poly([[0,-54],[16,-46],[18,-15],[3,60],[-3,60],[-8,-20]],body);
  this.polygon(c,[{x:-3,y:-49},{x:3,y:-49},{x:5,y:0},{x:0,y:58},{x:-2,y:0}],'rgba(255,247,218,.5)');
  const glass=c.createLinearGradient(0,-43,0,-20);glass.addColorStop(0,'#577f7c');glass.addColorStop(1,'#1c4147');poly([[-16,-43],[16,-43],[21,-20],[-21,-20]],glass);poly([[0,-41],[12,-40],[16,-23],[2,-24]],'#6d9693');
  this.polygon(c,[{x:-13,y:-41},{x:-8,y:-41},{x:4,y:-22},{x:-1,y:-22}],'rgba(255,255,255,.52)');this.polygon(c,[{x:-4,y:-41},{x:-2,y:-41},{x:10,y:-23},{x:8,y:-23}],'rgba(255,255,255,.16)');
  c.save();c.fillStyle='rgba(58,38,8,.22)';c.shadowColor=c.fillStyle;c.shadowBlur=8;c.beginPath();c.ellipse(0,-6,22,9,0,0,7);c.fill();c.restore();
  poly([[-175,-24],[-171,-37],[-32,-30],[0,-34],[32,-30],[171,-37],[175,-24],[32,-9],[-32,-9]],'#e5ba77');poly([[-175,-24],[-32,-9],[32,-9],[175,-24],[169,-18],[31,-3],[-31,-3],[-169,-18]],'#9b7b4d');
  c.strokeStyle='#ffe0a0';c.lineWidth=2;c.beginPath();c.moveTo(-170,-36);c.lineTo(-30,-29);c.lineTo(0,-33);c.lineTo(30,-29);c.lineTo(170,-36);c.stroke();
  c.strokeStyle='#35504c';c.lineWidth=3;for(const s of [-1,1]){c.beginPath();c.moveTo(s*18,17);c.lineTo(s*102,-17);c.moveTo(s*16,9);c.lineTo(s*64,-20);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(s*139,-32);c.lineTo(s*138,-22);c.stroke();c.lineWidth=3;}
  poly([[-9,40],[-64,49],[-68,58],[-8,55],[8,55],[68,58],[64,49],[9,40]],'#b98e53');poly([[-3,60],[-8,18],[-5,-2],[4,-5],[12,49],[5,63]],'#d7a866');poly([[4,-5],[12,49],[5,63],[4,10]],'#a77d47');
  c.strokeStyle='rgba(90,64,32,.35)';c.lineWidth=1;for(const y of [5,17,34]){const w=y>20?9:15;c.beginPath();c.moveTo(-w,y);c.lineTo(w,y+2);c.stroke();c.fillStyle='rgba(70,50,26,.4)';for(let k=0;k<6;k++)c.fillRect(-w+k*w*.36,y,1,1);}
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*35,-22);c.lineTo(side*166,-29);c.stroke();for(let k=0;k<22;k++){c.fillStyle='rgba(70,50,26,.4)';c.fillRect(side*(35+k*6),-29-k*.3,1,1);}}
  const brushed=c.createLinearGradient(0,-12,0,58);brushed.addColorStop(0,'rgba(255,244,214,0)');brushed.addColorStop(.45,'rgba(255,244,214,.35)');brushed.addColorStop(1,'rgba(255,244,214,0)');c.strokeStyle=brushed;c.lineWidth=3;c.beginPath();c.moveTo(2,-10);c.lineTo(5,56);c.stroke();
  c.strokeStyle='rgba(255,214,150,.5)';c.lineWidth=1.5;c.beginPath();c.moveTo(-17,-50);c.lineTo(17,-50);c.lineTo(23,-14);c.moveTo(20,0);c.lineTo(8,62);c.moveTo(32,-30);c.lineTo(171,-37);c.lineTo(175,-24);c.stroke();
  c.save();c.translate(-1,30);c.rotate(-Math.PI/2);c.fillStyle='#35504b';c.font='bold 9px monospace';c.fillText('RR-07',-17,0);c.restore();
  for(const [x,color] of [[-173,'#d9826d'],[173,'#b9d6ac']]){c.fillStyle=color;c.shadowColor=color;c.shadowBlur=10;c.beginPath();c.arc(x,-25,3,0,7);c.fill();}c.restore();
 }
 drawWeather(c){if(this.mission===2){for(let i=0;i<3;i++)RR.fx.cloud(c,180+i*460,100+i%2*45,520,145,'dark',.4,i+30);c.strokeStyle='#cfdbd35c';c.lineWidth=1;for(let n=0;n<190;n++){const x=((n*173-this.time*260)%1340+1340)%1340,y=(n*79+this.time*390)%670;c.beginPath();c.moveTo(x,y);c.lineTo(x-22,y+34);c.stroke();}}if(this.boosting&&this.altitude<100){c.strokeStyle='#ddd7ae33';for(let n=0;n<12;n++){let x=n*117;c.beginPath();c.moveTo(x,580);c.lineTo(x+(x-640)*.08,620);c.stroke();}}}
 draw(c,g){this.time=g.time;c.save();c.beginPath();c.rect(0,74,1280,579);c.clip();if(g.shake)c.translate(Math.sin(g.time*95)*g.shake,Math.cos(g.time*77)*g.shake*.5);if(this.mission===2)c.translate(Math.sin(g.time*19)*1.4,Math.cos(g.time*23));if(RR.art.ready(this.mission===2?'storm':'chase')){RR.art.drawChase(c,{storm:this.mission===2,low:this.altitude<90,lateral:this.lateral,bank:this.bank,pitch:this.pitch,speed:this.speed,altitude:this.altitude});}else{this.drawSky(c);this.drawFarMountains(c);this.drawValleyFloor(c);}if(this.mission===2){c.fillStyle='#142c3838';c.fillRect(0,74,1280,579);}this.drawRunways(c);this.drawRingsAhead(c);this.drawChasePlane(c);this.drawWeather(c);c.restore();
  RR.fx.finish(c,{sunX:950,sunY:242,storm:this.mission===2});
  Object.assign(this.planeFacade,{x:this.z,y:this.altitude,vx:this.speed,pitch:this.pitch,grounded:this.grounded,throttle:this.throttle,fuel:this.fuel,hp:this.hp,boost:this.boost,stall:this.stall});const plane=g.plane,world=g.world;try{g.plane=this.planeFacade;g.world=this.worldFacade;RR.ui.draw(c,g);}finally{g.plane=plane;g.world=world;}

 }
};
