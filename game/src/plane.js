RR.Plane=class{
 constructor(world){this.world=world;this.x=125;this.y=world.ground(this.x)+15;this.vx=0;this.vy=0;this.pitch=0;this.throttle=.18;this.fuel=world.spec.fuel;this.hp=100;this.boost=100;this.boosting=false;this.grounded=true;this.invincible=0;this.stall=false;this.trail=[];this.landed=new Set();}
 update(dt,g){const input=RR.input,w=g.world;
  this.throttle=Math.max(0,Math.min(1,this.throttle+(input.held('w','arrowup')?dt*.35:0)-(input.held('s','arrowdown')?dt*.35:0)));
  if(input.drag)this.throttle=Math.max(0,Math.min(1,(770-input.pointer.y)/84));
  let turn=(input.held('a','arrowleft')?1:0)-(input.held('d','arrowright')?1:0);
  this.pitch=Math.max(-.55,Math.min(.65,this.pitch+turn*dt*.7));
  this.boosting=input.held(' ')&&this.boost>0&&this.fuel>0&&!this.grounded;
  this.boost=Math.max(0,Math.min(100,this.boost+(this.boosting?-42:12)*dt));
  if(this.fuel<=0)this.throttle=0;
  this.fuel=Math.max(0,this.fuel-dt*(.12+this.throttle*.40+(this.boosting?.6:0)));
  let wind=w.wind(this.x,g.time),speed=this.vx;
  this.vx=Math.max(0,this.vx+dt*(this.throttle*49+(this.boosting?65:0)-speed*.19-Math.abs(this.pitch)*10-Math.abs(turn)*Math.max(0,speed-155)*.2));
  this.stall=!this.grounded&&speed<58;
  let desired=Math.sin(this.pitch)*speed*.95+(speed-100)*.12+wind*.38-Math.abs(turn)*Math.max(0,speed-155)*.25;
  if(this.stall){desired-=65;this.pitch=Math.max(-.5,this.pitch-dt*.23);}
  this.vy+=(desired-this.vy)*Math.min(1,dt*1.8);
  this.x+=this.vx*dt;this.y+=this.vy*dt;
  if(this.grounded){this.y=w.ground(this.x)+15;this.vy=0;if(this.vx>72&&this.pitch>.08){this.grounded=false;this.y+=3;this.vy=10;}else if(!w.runway(this.x)){this.grounded=false;this.y+=1;}}
  this.invincible=Math.max(0,this.invincible-dt);
  const floor=w.ground(this.x)+15;
  if(!this.grounded&&this.y<=floor){const r=w.runway(this.x);if(r&&Math.abs(this.vy)<29&&this.vx<150&&Math.abs(this.pitch)<.24){this.grounded=true;this.y=floor;this.pitch=0;this.vy=0;if(!this.landed.has(r.id)){this.landed.add(r.id);g.score+=350;g.message='CLEAN TOUCHDOWN  +350';g.messageTime=4;RR.audio.ring();}if(r.id===1){if(w.mission!==0||g.rings===w.rings.length)g.finish(true);else{g.finish(false,'You missed a ring. Follow the golden trail.');}}}else{this.damage(32+Math.abs(this.vy)*.65,g);this.y=floor+10;this.vy=38;this.pitch=.16;this.vx*=.7;}}
  if(this.grounded){if(this.throttle<.32)this.vx=Math.max(0,this.vx-35*dt);this.fuel=Math.min(w.runway(this.x)?.id===0?w.spec.fuel:100,this.fuel+dt*9);this.hp=Math.min(100,this.hp+dt*12);}
  if(this.y>690){this.y=690;this.vy=Math.min(0,this.vy);}
  for(const b of w.balloons)if(Math.hypot(this.x-b.x,this.y-b.y-Math.sin(g.time*.6+b.x)*12)<45){this.damage(24,g);this.vy-=15;}
  if(w.mission===0)for(const r of w.rings){if(!r.hit&&!r.miss&&this.x>r.x+40){r.miss=true;g.combo=0;}if(!r.hit){const nd=Math.hypot((this.x-r.x)/26,(this.y-r.y)/r.r);if(nd<=1){r.hit=true;g.rings++;g.combo=(g.combo||0)+1;const perfect=nd<=.45,points=(perfect?300:200)+50*(g.combo-1);g.score+=points;g.message=`RING ${g.rings} / ${w.rings.length}  +${points}${perfect?'  PERFECT':''}`;g.messageTime=2;RR.audio.ring();g.floaters.push({text:`+${points}`,label:perfect?(g.combo>1?`PERFECT · COMBO ×${g.combo}`:'PERFECT'):(g.combo>1?`COMBO ×${g.combo}`:'RING'),t:0,life:1.5});g.particles.push(...Array.from({length:16},(_,i)=>({x:r.x,y:r.y,vx:Math.cos(i)*45,vy:Math.sin(i)*70,life:1})));}}}
  if(this.hp<=0)g.finish(false,'The canyon won this round. Give the ridge more room.');
  if(this.x>w.end+450)g.finish(false,'Strip missed. Slow down and descend earlier.');
  if(this.fuel===0&&this.vx<25)g.finish(false,'Out of fuel. Use a steady cruise throttle.');
  this.trail.push({x:this.x-50,y:this.y,life:1});if(this.trail.length>40)this.trail.shift();
 }
 damage(amount,g){if(this.invincible>0)return;this.hp=Math.max(0,this.hp-amount);this.invincible=1.6;g.combo=0;g.shake=12;g.message='HARD HIT · CHECK AIRFRAME';g.messageTime=2.5;RR.audio.hit();}
 draw(c,cam,t){let x=this.x-cam.x,y=560-(this.y-cam.y);
  if(!this.grounded){const ground=this.world.ground(this.x),fade=Math.max(0,1-Math.max(0,this.y-ground)/500);c.save();c.translate(x,560-(ground-cam.y));c.scale(58*fade+8,7);const shadow=c.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,`rgba(10,34,39,${.22*fade})`);shadow.addColorStop(1,'rgba(10,34,39,0)');c.fillStyle=shadow;c.beginPath();c.ellipse(0,0,1,1,0,0,Math.PI*2);c.fill();c.restore();}
  c.save();c.strokeStyle=this.boosting?'#ffdb8c88':'#fff1c322';c.lineWidth=this.boosting?4:2;c.beginPath();this.trail.forEach(p=>c.lineTo(p.x-cam.x,560-(p.y-cam.y)));c.stroke();c.translate(x,y);c.rotate(-this.pitch);
  if(this.invincible>0&&Math.floor(t*12)%2)c.globalAlpha=.65;
  if(RR.art.ready('planeSide')){
   c.drawImage(RR.art.planeSide,-300*.48,-130*.76,300,130);
   if(this.boosting)for(let i=0;i<3;i++){const x=-150-i*12.5,r=6+i*3,g=c.createRadialGradient(x,4,0,x,4,r);g.addColorStop(0,'rgba(224,214,182,.28)');g.addColorStop(1,'rgba(224,214,182,0)');c.fillStyle=g;c.fillRect(x-r,4-r,r*2,r*2);}
   c.shadowBlur=9;c.shadowColor='#f26656';c.fillStyle='#fc8067';c.beginPath();c.arc(-128,-52,3,0,7);c.fill();c.shadowColor='#c4f6c0';c.fillStyle='#d4f5ba';c.beginPath();c.arc(128,-52,2.5,0,7);c.fill();c.restore();return;
  }
  // Landing gear, wing struts, and a high wing with visible underside.
  c.strokeStyle='#173f46';c.lineWidth=4;c.beginPath();c.moveTo(-10,8);c.lineTo(-6,26);c.moveTo(19,5);c.lineTo(11,27);c.stroke();
  c.fillStyle='#143b42';for(const wx of [-6,12]){c.beginPath();c.arc(wx,25,7,0,7);c.fill();c.fillStyle='#9bb4a5';c.beginPath();c.arc(wx,25,2,0,7);c.fill();c.fillStyle='#143b42';}
  const body=c.createLinearGradient(0,-27,0,14);body.addColorStop(0,'#f7c46a');body.addColorStop(.55,'#e09a37');body.addColorStop(1,'#c67f2a');c.fillStyle=body;c.strokeStyle='#173f46';c.lineWidth=2;c.beginPath();c.moveTo(-62,1);c.lineTo(-67,-27);c.lineTo(-55,-27);c.lineTo(-38,-7);c.lineTo(24,-14);c.quadraticCurveTo(48,-12,51,0);c.quadraticCurveTo(46,14,22,14);c.lineTo(-49,5);c.closePath();c.fill();c.stroke();
  c.fillStyle='rgba(120,70,10,.25)';c.beginPath();c.moveTo(-49,3);c.lineTo(43,8);c.lineTo(22,14);c.closePath();c.fill();
  c.fillStyle='#ffcf75';c.beginPath();c.moveTo(-49,1);c.lineTo(43,0);c.lineTo(34,7);c.lineTo(-44,5);c.fill();const glass=c.createLinearGradient(0,-30,0,-12);glass.addColorStop(0,'#244e56');glass.addColorStop(1,'#10282f');c.fillStyle=glass;c.beginPath();c.moveTo(-11,-13);c.lineTo(-4,-30);c.lineTo(16,-29);c.lineTo(29,-12);c.closePath();c.fill();c.strokeStyle='#a3d3c5';c.lineWidth=2;c.beginPath();c.moveTo(4,-27);c.lineTo(5,-13);c.moveTo(16,-26);c.lineTo(24,-15);c.stroke();
  c.strokeStyle='rgba(255,255,255,.58)';c.lineWidth=3;c.beginPath();c.moveTo(-6,-28);c.lineTo(10,-14);c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.arc(11,-26,1.5,0,7);c.fill();
  c.strokeStyle='#284d4c';c.lineWidth=2;c.beginPath();c.moveTo(16,9);c.lineTo(-17,-32);c.moveTo(16,9);c.lineTo(34,-32);c.stroke();
  const wing=c.createLinearGradient(0,-35,0,-26);wing.addColorStop(0,'#f9d07c');wing.addColorStop(1,'#eda93f');c.fillStyle=wing;c.beginPath();c.moveTo(-36,-34);c.lineTo(36,-35);c.lineTo(45,-29);c.lineTo(-41,-26);c.closePath();c.fill();c.stroke();c.fillStyle='rgba(255,235,185,.95)';c.fillRect(-33,-34,65,3);
  // Surface marks only: existing outlines, gear and pose remain untouched.
  c.strokeStyle='rgba(90,64,32,.35)';c.lineWidth=1;for(const px of [-23,0,32]){c.beginPath();c.moveTo(px,-7);c.lineTo(px,px===32?10:6);c.stroke();c.fillStyle='rgba(70,50,26,.4)';for(let k=0;k<4;k++)c.fillRect(px+2,-5+k*3,1,1);}
  c.beginPath();c.moveTo(-32,-29);c.lineTo(36,-31);c.stroke();for(let k=0;k<17;k++){c.fillStyle='rgba(70,50,26,.4)';c.fillRect(-31+k*4,-32,1,1);}
  const brushed=c.createLinearGradient(-39,-8,43,-8);brushed.addColorStop(0,'rgba(255,244,214,0)');brushed.addColorStop(.5,'rgba(255,244,214,.35)');brushed.addColorStop(1,'rgba(255,244,214,0)');c.strokeStyle=brushed;c.lineWidth=3;c.beginPath();c.moveTo(-37,-5);c.quadraticCurveTo(10,-13,42,-7);c.stroke();
  c.strokeStyle='rgba(255,214,150,.5)';c.lineWidth=1.5;c.beginPath();c.moveTo(-38,-7);c.lineTo(24,-14);c.quadraticCurveTo(43,-12,48,-5);c.moveTo(-36,-34);c.lineTo(36,-35);c.lineTo(45,-29);c.stroke();
  c.fillStyle='#173f46';c.font='bold 9px monospace';c.fillText('RR–07',-39,0);
  c.fillStyle='#eab05b';c.beginPath();c.moveTo(-56,0);c.lineTo(-76,7);c.lineTo(-44,8);c.lineTo(-38,3);c.fill();
  c.fillStyle='#244c50';c.fillRect(47,-9,7,19);
  // Open blade strokes stay attached to the hub; no closed loop resembling a glyph.
  c.fillRect(52,-2,6,4);c.strokeStyle='#fff3c933';c.lineWidth=5;c.beginPath();c.moveTo(57,-25);c.lineTo(57,25);c.stroke();
  const blade=16+10*Math.abs(Math.sin(t*48));c.fillStyle='rgba(255,243,201,.16)';c.beginPath();c.moveTo(55,-blade);c.quadraticCurveTo(60,-blade,60,-blade+5);c.lineTo(60,blade-5);c.quadraticCurveTo(60,blade,55,blade);c.quadraticCurveTo(50,blade,50,blade-5);c.lineTo(50,-blade+5);c.quadraticCurveTo(50,-blade,55,-blade);c.fill();c.strokeStyle='rgba(255,243,201,.5)';c.lineWidth=2;c.beginPath();c.moveTo(55,-blade);c.lineTo(59,blade);c.stroke();
  if(this.boosting)for(let i=0;i<3;i++){const x=-70-i*12.5,r=6+i*3,g=c.createRadialGradient(x,4,0,x,4,r);g.addColorStop(0,'rgba(224,214,182,.28)');g.addColorStop(1,'rgba(224,214,182,0)');c.fillStyle=g;c.fillRect(x-r,4-r,r*2,r*2);}
  c.shadowBlur=9;c.shadowColor='#f26656';c.fillStyle='#fc8067';c.beginPath();c.arc(-38,-28,3,0,7);c.fill();c.shadowColor='#c4f6c0';c.fillStyle='#d4f5ba';c.beginPath();c.arc(40,-30,2.5,0,7);c.fill();c.restore();
 }
};
