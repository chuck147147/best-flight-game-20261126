RR.ui={
 text(c,s,x,y,size=14,color='#f8e7bd',font='monospace'){c.fillStyle=color;c.font=`${size>=20?'bold ':''}${size}px ${font}`;c.fillText(s,x,y);},
 box(c,x,y,w,h,fill='#123d43',stroke='#729488'){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}},
 draw(c,g){const p=g.plane,w=g.world,t=this.text; c.textAlign='left';
  const aglFeet=Math.max(0,(p.y-w.ground(p.x))*3.28),strip=w.runway(p.x);
  const mslFeet=p.grounded&&strip?strip.fieldElevationFt+aglFeet:w.mslFeet(p.y);
  c.fillStyle='#10363de8';c.fillRect(0,0,1280,73);c.fillStyle='#efb85c';c.fillRect(0,72,1280,2);
  t(c,'RIDGE RUNNER',30,35,24,'#ffdb94','Arial');t(c,'ALPINE AIR SERVICE  /  EST. 1978',31,56,10,'#a9c2b8');
  t(c,w.spec.name,382,30,15);t(c,w.mission===0?`GOLDEN TRAIL   ${g.rings} / 8 RINGS` : w.mission===1?'RESCUE  /  FOLLOW THE SMOKE':'CARGO SECURED  /  WATCH YOUR FUEL',382,53,11,'#a9c2b8');
  t(c,'FLIGHT SCORE',922,26,10,'#a9c2b8');t(c,String(g.score).padStart(5,'0'),922,52,23);t(c,'LOCAL TIME',1128,26,10,'#a9c2b8');t(c,`06:${String(12+Math.floor(g.time/60)).padStart(2,'0')}`,1128,51,22);
  let next=w.mission===0?w.rings.find(r=>!r.hit):null;let target=next?next.x:w.end-240;let distance=Math.max(0,target-p.x);
  this.box(c,30,95,228,57,'#153e43d9','#a3b49b66');t(c,next?`NEXT GATE  /  ${w.rings.indexOf(next)+1}`:'APPROACH  /  SHORT STRIP',46,117,11,'#c2d0b8');t(c,`${(distance/1000).toFixed(2)} km  →`,46,141,21,'#ffd28a');
  t(c,'WIND',1100,111,11,w.mission===2?'#dce8dd':'#244e52');t(c,`${w.wind(p.x,g.time)>=0?'→':'←'} ${Math.abs(w.wind(p.x,g.time)).toFixed(0)} KT`,1100,136,21,w.mission===2?'#dce8dd':'#244e52');
  if(g.messageTime>0){c.textAlign='center';this.box(c,420,98,440,44,'#173f44e8','#cfa75f');t(c,g.message,640,126,15,'#ffdb92');c.textAlign='left';}
  if(p.stall&&g.state==='play'){c.textAlign='center';t(c,'STALL  /  LOWER THE NOSE · ADD POWER',640,190,21,'#963e30');c.textAlign='left';}
  // The cockpit strip stays legible against every landscape.
  c.fillStyle='#0c2b32';c.fillRect(0,653,1280,147);c.fillStyle='#31585a';c.fillRect(0,653,1280,3);c.fillStyle='#e8b868';c.fillRect(30,653,100,3);
  t(c,'RR–07',30,685,19);t(c,'BUSHMASTER',30,706,10,'#91aea5');t(c,'HIGH-WING / STOL',30,726,10,'#91aea5');t(c,p.grounded?'● ON STRIP':'● AIRBORNE',30,766,11,'#d8e5b8');
  const dial=(x,label,value,unit,ratio)=>{c.save();c.translate(x,720);c.fillStyle='#173b40';c.strokeStyle='#4a706b';c.lineWidth=2;c.beginPath();c.arc(0,0,51,0,7);c.fill();c.stroke();for(let i=0;i<=10;i++){let a=label==='ALTITUDE'?Math.PI*(1.16+i*.068):Math.PI*.78+i*Math.PI*1.44/10;c.strokeStyle=i>7?'#e5b565':'#75978b';c.beginPath();c.moveTo(Math.cos(a)*43,Math.sin(a)*43);c.lineTo(Math.cos(a)*47,Math.sin(a)*47);c.stroke();}let fraction=Math.max(0,Math.min(1,ratio)),a=label==='ALTITUDE'?Math.PI*(1.16+fraction*.68):Math.PI*.78+fraction*Math.PI*1.44;c.strokeStyle='#ffce76';c.lineWidth=3;c.beginPath();let inner=label==='ALTITUDE'?43:32,outer=label==='ALTITUDE'?49:41;c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();c.textAlign='center';t(c,label,0,-17,9,'#99b7ab');t(c,String(value),0,10,27,'#ffe0a1');t(c,unit,0,29,9,'#a6c6b6');c.restore();};
  dial(245,'ALTITUDE',Math.round(mslFeet),'FT MSL',mslFeet/w.mslFeet(650));dial(377,'AIRSPEED',Math.round(p.vx*.65),'KNOTS',p.vx/220);dial(509,'HEADING','090','E  ·  CANYON',.5);
  t(c,'AIRFRAME',603,686,10,'#a3bdb0');t(c,`${Math.round(p.hp)}%`,735,686,13,p.hp<35?'#f38c6a':'#dfebc5');this.bar(c,603,699,164,7,p.hp/100,'#9ac7ac');
  t(c,'FUEL',603,735,10,'#a3bdb0');t(c,`${Math.ceil(p.fuel)} L`,735,735,13,p.fuel<20?'#f38c6a':'#dfebc5');this.bar(c,603,748,164,7,p.fuel/100,p.fuel<20?'#e78563':'#e8bc6c');
  t(c,'BOOST',811,686,10,'#a3bdb0');this.bar(c,811,700,119,7,p.boost/100,'#e8bc6c');t(c,'SPACE / BURST',811,731,10,'#a3bdb0');t(c,`AGL ${Math.round(aglFeet)} FT`,811,756,12,'#ffd38a');
  t(c,'TRIM',969,686,10,'#a3bdb0');t(c,`${p.pitch>=0?'+':''}${Math.round(p.pitch*57)}°`,969,714,22);t(c,'A ↗   D ↘',969,746,11,'#a3bdb0');
  t(c,'THROTTLE',1111,680,10,'#a3bdb0');c.fillStyle='#071f25';c.fillRect(1133,693,9,77);for(let i=0;i<5;i++){c.fillStyle='#658b80';c.fillRect(1152,695+i*18,9,1);}let ly=770-p.throttle*84;this.box(c,1120,ly-7,34,16,'#eabe76','#ffe0a2');t(c,`${Math.round(p.throttle*100)}%`,1181,725,20);t(c,'W / S',1181,750,10,'#a3bdb0');
  c.textAlign='center';t(c,'W/S THROTTLE     A/D PITCH     SPACE BOOST     P PAUSE     R RESTART     M SOUND',640,789,10,'#72968d');c.textAlign='left';
  // Route ribbon: runway, current position, and destination.
  c.strokeStyle='#e4d5a544';c.lineWidth=2;c.beginPath();c.moveTo(30,628);c.lineTo(1250,628);c.stroke();let px=30+Math.min(1,p.x/w.end)*1220;c.fillStyle='#ffe0a2';c.beginPath();c.moveTo(px,620);c.lineTo(px+6,628);c.lineTo(px,636);c.lineTo(px-6,628);c.fill();t(c,'ALDER',30,614,9,'#c7d2b4');c.textAlign='right';t(c,w.runways[1].name,1250,614,9,'#c7d2b4');c.textAlign='left';
 },
 bar(c,x,y,w,h,value,color){c.fillStyle='#294a4b';c.fillRect(x,y,w,h);c.fillStyle=color;c.fillRect(x,y,w*Math.max(0,Math.min(1,value)),h);},
 title(c,g){const t=this.text;c.fillStyle='#0c3339c7';c.fillRect(0,74,1280,579);t(c,'YOUR NEXT GREAT ESCAPE',65,132,12,'#aac5b6');t(c,'RIDGE',59,222,91,'#ffdf9f','Arial');t(c,'RUNNER',59,307,91,'#ffdf9f','Arial');t(c,'A little plane. A very big wilderness.',65,351,19,'#d0d9bf','Arial');t(c,'Fly the ridge. Respect the weather. Find your way home.',65,380,13,'#9cbbaf');
  for(let i=0;i<3;i++){let y=123+i*133;this.box(c,754,y,461,114,i===g.selected?'#315851':'#143b40',i===g.selected?'#f1be6b':'#51756d');t(c,`0${i+1}`,775,y+36,23,i===g.selected?'#ffcf7c':'#94b3a6');t(c,RR.missions[i].name,831,y+35,20);t(c,RR.missions[i].goal,777,y+65,12,'#bdceba');t(c,i===0?'PRECISION  /  8 GATES':i===1?'SHORT-FIELD  /  RESCUE':'ENDURANCE  /  GUSTS',777,y+92,10,'#d4b479');}
  this.box(c,65,428,312,57,'#efbd6b',null);t(c,'START FLIGHT   →',92,464,22,'#183c3e','Arial');t(c,'ENTER TO FLY  ·  1 / 2 / 3 TO SELECT',65,512,11,'#a8c4b6');t(c,`PERSONAL BEST   ${String(g.best).padStart(5,'0')}`,65,551,14,'#ffda96');t(c,'PILOT’S NOTE',754,557,11,'#e8bc78');t(c,'W to build speed. A to climb. D to lower the nose.',754,580,12,'#b8cebb');t(c,'Land below 97 kt, nose level, and sink gently.',754,601,12,'#b8cebb');
 },
 overlay(c,g){const t=this.text;c.fillStyle='#082e3699';c.fillRect(0,74,1280,579);this.box(c,345,190,590,330,'#103a40f5','#c7a269');c.textAlign='center';t(c,g.state==='pause'?'TAKE A BREATHER':g.state==='win'?'DELIVERY OF A LIFETIME':'BACK TO THE HANGAR',640,244,12,'#9ebead');t(c,g.state==='pause'?'FLIGHT PAUSED':g.state==='win'?'MISSION COMPLETE':'FLIGHT ENDED',640,294,35,'#ffda92','Arial');t(c,g.result||'The mountains will wait for you.',640,336,13,'#c1d3be');t(c,`SCORE ${g.score}    /    BEST ${g.best}`,640,386,19);this.box(c,465,423,350,49,'#eabb6b',null);t(c,g.state==='pause'?'P / RESUME FLIGHT':'R / FLY AGAIN',640,454,17,'#173f43');t(c,'ESC / MISSION SELECT',640,498,11,'#a4c1b3');c.textAlign='left';}
};
