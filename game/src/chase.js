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
 drawSky(c){const storm=this.mission===2,sky=c.createLinearGradient(0,74,0,580);sky.addColorStop(0,storm?'#243640':'#477b83');sky.addColorStop(.48,storm?'#52666b':'#c6c2a0');sky.addColorStop(1,storm?'#788780':'#f0d1a0');c.fillStyle=sky;c.fillRect(0,0,1280,800);
  const glow=c.createRadialGradient(950,242,12,950,242,180);glow.addColorStop(0,storm?'#a5b7b012':'#ffe7b580');glow.addColorStop(1,'#ffe6b000');c.fillStyle=glow;c.fillRect(760,74,400,370);c.fillStyle=storm?'#96aaa328':'#ffe3ab';c.beginPath();c.arc(950,242,34,0,7);c.fill();
  for(let j=0;j<5;j++){c.fillStyle=storm?'#344b5528':'#eee1bd28';c.beginPath();c.ellipse(120+j*267,155+j%3*29,110,8,0,0,7);c.fill();}
 }
 drawFarMountains(c){
  for(let layer=0;layer<3;layer++){const base=350+layer*20,spacing=310+layer*80;for(let n=-1;n<5;n++){const x=n*spacing-this.lateral*(.03+layer*.035),peak=190+layer*30+Math.sin(n*2.1+layer)*42;
   this.polygon(c,[{x:x-200,y:base},{x:x+100,y:peak},{x:x+370,y:base}],['#8da6a0','#678e8c','#3d7075'][layer]);this.polygon(c,[{x:x+100,y:peak},{x:x+180,y:base},{x:x+370,y:base}],['#b1bbb0','#88a29a','#548480'][layer]);
   if(layer<2)this.polygon(c,[{x:x+100,y:peak},{x:x+39,y:peak+34},{x:x+88,y:peak+26},{x:x+107,y:peak+41},{x:x+126,y:peak+27},{x:x+160,y:peak+37}],layer?'#b5c6b7':'#d9ddc4');}}
  const haze=c.createLinearGradient(0,275,0,385);haze.addColorStop(0,'#dbd5b000');haze.addColorStop(.5,'#c8cdb434');haze.addColorStop(1,'#c8cdb400');c.fillStyle=haze;c.fillRect(0,275,1280,110);
 }
 riverCentre(z){return -110+Math.sin(z*.0017)*100;}
 drawValleyFloor(c){
  c.fillStyle='#325b56';c.fillRect(0,365,1280,300);
  const depths=[];for(let d=20;d<5200;d+=Math.min(55,Math.max(4,d*.065)))depths.push(d);depths.push(5200);
  for(let j=depths.length-2;j>=0;j--){const a=this.z-200+depths[j],b=this.z-200+depths[j+1];this.worldPolygon(c,[[-1600,0,a],[1600,0,a],[1600,0,b],[-1600,0,b]],j%2?'#3d665b':'#486f62');
   // Clip broad world-space fields to each depth strip so the river and slopes stay in front.
   for(const [x,z,w,length,color] of [[-350,900,190,480,'#41695d'],[210,2100,210,650,'#3d665b'],[-370,3300,230,720,'#548480'],[235,4600,185,560,'#41695d'],[-340,5550,190,650,'#548480'],[210,6300,230,580,'#3d665b']]){const near=Math.max(a,z),far=Math.min(b,z+length);if(near<far){c.save();c.globalAlpha=.23;this.worldPolygon(c,[[x+25*(near-z)/length,0,near],[x+w-35*(near-z)/length,0,near],[x+w-35*(far-z)/length,0,far],[x+25*(far-z)/length,0,far]],color);c.restore();}}
   const ra=this.riverCentre(a),rb=this.riverCentre(b);this.worldPolygon(c,[[ra-34,1,a],[ra+34,1,a],[rb+34,1,b],[rb-34,1,b]],'#609e98');this.worldPolygon(c,[[ra+27,2,a],[ra+34,2,a],[rb+34,2,b],[rb+27,2,b]],'#a1b9a080');

  }
  // Continuous faces avoid antialiased seams between narrow depth tiles.
  for(const side of [-1,1]){const toe=[],ridge=[],crest=[];for(const d of depths){const z=this.z-200+d,h=290+Math.sin(z*.003)*65;toe.push([side*480,0,z]);ridge.push([side*950,h,z]);crest.push([side*1300,h+160,z]);}this.worldPolygon(c,[...ridge,...crest.slice().reverse()],side<0?'#21494e':'#355d58');this.worldPolygon(c,[...toe,...ridge.slice().reverse()],side<0?'#285454':'#426b62');}
  for(let n=Math.ceil((this.z+3600)/73);n>=Math.floor((this.z-140)/73);n--){const z=n*73,hash=Math.sin(n*127.1)*43758.5453,f=hash-Math.floor(hash);for(const side of [-1,1]){const x=side*(170+f*280);const p=this.projectPoint(x,0,z),h=(19+f*16)*p.scale,w=h*.32;if(p.y>680)continue;this.polygon(c,[{x:p.x,y:p.y-h},{x:p.x-w,y:p.y},{x:p.x+w,y:p.y}],side<0?'#153f43':'#254f48');if(n%4===0){const r=this.projectPoint(x*.8,0,z+26);this.polygon(c,[{x:r.x-8*r.scale,y:r.y},{x:r.x-3*r.scale,y:r.y-7*r.scale},{x:r.x+7*r.scale,y:r.y}], '#718378');}}}
 }
 drawRunways(c){for(const r of this.runways){if(r.x+r.w<this.z-180||r.x-this.z>4200)continue;const start=Math.max(r.x,this.z-180),end=r.x+r.w;
   // Clip all markings to a single coplanar trapezoid, including at long range.
   c.save();this.worldPolygon(c,[[-48,2,start],[48,2,start],[48,2,end],[-48,2,end]],'#9b9d85');c.clip();
   for(let z=r.x;z<end;z+=60){const near=Math.max(start,z),far=Math.min(end,z+26);if(near<far)this.worldPolygon(c,[[-2,2,near],[2,2,near],[2,2,far],[-2,2,far]],'#eee0b2');if(z<start)continue;for(const x of [-44,44]){const p=this.projectPoint(x,2,z);c.fillStyle='#ffe1a0';c.beginPath();c.arc(p.x,p.y,Math.max(.65,p.scale*2),0,7);c.fill();}}
   c.restore();
  }
 }
 drawRingsAhead(c){
  const visible=this.rings.map((r,n)=>({r,n,d:r.x-this.z})).filter(({r,d})=>!r.hit&&d>=-25&&d<=3000).sort((a,b)=>a.d-b.d).slice(0,3).map((item,i)=>{const p=this.projectPoint(item.r.lateral,item.r.y,item.r.x),radius=item.r.r*p.scale;return {...item,p,radius,badgeY:p.y-radius-16,opacity:i===0?1:i===1?.58:.16};});
  for(let i=1;i<visible.length;i++){const ring=visible[i];if(visible.slice(0,i).some(near=>Math.hypot(near.p.x-ring.p.x,near.badgeY-ring.badgeY)<46))ring.opacity=Math.min(ring.opacity,.35);if(visible.slice(0,i).some(near=>Math.hypot(near.p.x-ring.p.x,near.p.y-ring.p.y)<near.radius+ring.radius+12))ring.opacity=0;}
  for(const {n,p,radius,opacity} of visible.reverse()){c.save();c.globalAlpha=opacity;c.strokeStyle='#e7bc70';c.lineWidth=Math.max(2,5*p.scale);c.shadowColor=c.strokeStyle;c.shadowBlur=12*opacity;c.beginPath();c.ellipse(p.x,p.y,radius,radius,0,0,7);c.stroke();c.shadowBlur=0;c.strokeStyle='#f9e5b6';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,Math.max(0,radius-3),Math.PI,Math.PI*1.8);c.stroke();c.fillStyle='#21494b';c.beginPath();c.arc(p.x,p.y-radius-16,12,0,7);c.fill();c.fillStyle='#efd5a0';c.font='11px monospace';c.textAlign='center';c.fillText(String(n+1).padStart(2,'0'),p.x,p.y-radius-12);c.restore();}
 }
 drawChasePlane(c){
  const ground=this.projectPoint(this.lateral,0,this.z+30),fade=Math.max(0,1-this.altitude/400);c.fillStyle=`rgba(9,34,37,${fade*.24})`;c.beginPath();c.ellipse(ground.x,ground.y,80*fade+10,12*fade+2,0,0,7);c.fill();
  c.save();c.translate(640+this.bank*22,480+this.pitch*28);c.rotate(this.bank);const planeScale=1+Math.max(0,100-this.altitude)*.0015;c.scale(planeScale,planeScale);const poly=(p,color)=>{this.polygon(c,p.map(([x,y])=>({x,y})),color);c.strokeStyle='#183b40';c.lineWidth=.8;c.stroke();};const body=c.createLinearGradient(0,-54,0,65);body.addColorStop(0,'#eee4c4');body.addColorStop(.45,'#e9bc73');body.addColorStop(1,'#b98e53');
  c.strokeStyle='#dce5cc18';c.lineWidth=5;c.beginPath();c.moveTo(10,-36);c.bezierCurveTo(30,-10,15,40,28,80);c.stroke();
  c.fillStyle='#eee4c42a';c.beginPath();c.ellipse(0,-62,43,8,0,0,7);c.fill();c.strokeStyle='#f4e4bd66';c.lineWidth=2;c.beginPath();c.ellipse(0,-62,35,5,0,0,7);c.stroke();c.beginPath();const blade=Math.sin(this.time*48)*38;c.moveTo(-blade,-65);c.lineTo(blade,-59);c.stroke();
  c.strokeStyle='#183b40';c.lineWidth=6;for(const s of [-1,1]){c.beginPath();c.moveTo(s*13,10);c.lineTo(s*26,40);c.stroke();c.fillStyle='#16343a';c.beginPath();c.ellipse(s*27,42,6,10,0,0,7);c.fill();}
  poly([[-18,-50],[18,-50],[24,-13],[8,65],[-8,65],[-24,-13]],body);poly([[0,-54],[16,-46],[18,-15],[3,60],[-3,60],[-8,-20]],body);
  const glass=c.createLinearGradient(0,-43,0,-20);glass.addColorStop(0,'#6d9693');glass.addColorStop(1,'#254d53');poly([[-16,-43],[16,-43],[21,-20],[-21,-20]],glass);poly([[0,-41],[12,-40],[16,-23],[2,-24]],'#6d9693');
  poly([[-175,-24],[-171,-37],[-32,-30],[0,-34],[32,-30],[171,-37],[175,-24],[32,-9],[-32,-9]],'#e5ba77');poly([[-175,-24],[-32,-9],[32,-9],[175,-24],[169,-18],[31,-3],[-31,-3],[-169,-18]],'#9b7b4d');
  c.strokeStyle='#ffe0a0';c.lineWidth=2;c.beginPath();c.moveTo(-170,-36);c.lineTo(-30,-29);c.lineTo(0,-33);c.lineTo(30,-29);c.lineTo(170,-36);c.stroke();
  c.strokeStyle='#35504c';c.lineWidth=3;for(const s of [-1,1]){c.beginPath();c.moveTo(s*18,17);c.lineTo(s*102,-17);c.moveTo(s*16,9);c.lineTo(s*64,-20);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(s*139,-32);c.lineTo(s*138,-22);c.stroke();c.lineWidth=3;}
  poly([[-9,40],[-64,49],[-68,58],[-8,55],[8,55],[68,58],[64,49],[9,40]],'#b98e53');poly([[-3,60],[-8,18],[-5,-2],[4,-5],[12,49],[5,63]],'#d7a866');poly([[4,-5],[12,49],[5,63],[4,10]],'#a77d47');
  c.save();c.translate(-1,30);c.rotate(-Math.PI/2);c.fillStyle='#35504b';c.font='bold 9px monospace';c.fillText('RR-07',-17,0);c.restore();
  for(const [x,color] of [[-173,'#d9826d'],[173,'#b9d6ac']]){c.fillStyle=color;c.shadowColor=color;c.shadowBlur=10;c.beginPath();c.arc(x,-25,3,0,7);c.fill();}c.restore();
 }
 drawWeather(c){if(this.mission===2){c.strokeStyle='#cfdbd35c';c.lineWidth=1;for(let n=0;n<190;n++){const x=((n*173-this.time*260)%1340+1340)%1340,y=(n*79+this.time*390)%670;c.beginPath();c.moveTo(x,y);c.lineTo(x-22,y+34);c.stroke();}}if(this.boosting&&this.altitude<100){c.strokeStyle='#ddd7ae33';for(let n=0;n<12;n++){let x=n*117;c.beginPath();c.moveTo(x,580);c.lineTo(x+(x-640)*.08,620);c.stroke();}}}
 draw(c,g){this.time=g.time;c.save();c.beginPath();c.rect(0,74,1280,579);c.clip();if(g.shake)c.translate(Math.sin(g.time*95)*g.shake,Math.cos(g.time*77)*g.shake*.5);if(this.mission===2)c.translate(Math.sin(g.time*19)*1.4,Math.cos(g.time*23));this.drawSky(c);this.drawFarMountains(c);this.drawValleyFloor(c);if(this.mission===2){c.fillStyle='#142c3838';c.fillRect(0,74,1280,579);}this.drawRunways(c);this.drawRingsAhead(c);this.drawChasePlane(c);this.drawWeather(c);c.restore();
  Object.assign(this.planeFacade,{x:this.z,y:this.altitude,vx:this.speed,pitch:this.pitch,grounded:this.grounded,throttle:this.throttle,fuel:this.fuel,hp:this.hp,boost:this.boost,stall:this.stall});const plane=g.plane,world=g.world;try{g.plane=this.planeFacade;g.world=this.worldFacade;RR.ui.draw(c,g);}finally{g.plane=plane;g.world=world;}

 }
};
