// Headless logic checks only. This is not a browser or screenshot substitute.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = { console, Math, Set, URLSearchParams, location:{search:''}, localStorage:{getItem(){return null},setItem(){}}, setTimeout(){}, window:null };
context.window=context;
context.addEventListener=()=>{};
const gradient={addColorStop(){}};
const draw=new Proxy({}, {get(o,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>gradient;if(k in o)return o[k];return (...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),`Nonfinite drawing argument: ${String(k)}`);};},set(o,k,v){o[k]=v;return true;}});
const canvas={getContext:()=>draw,addEventListener(){},focus(){},getBoundingClientRect(){return {left:0,top:0,width:1280,height:800}}};
context.document={getElementById:()=>canvas};context.requestAnimationFrame=()=>{};
vm.createContext(context);
for(const name of ['audio','input','world','plane','hud','shots','main'])vm.runInContext(readFileSync(`game/src/${name}.js`,'utf8'),context,{filename:name+'.js'});
const {RR}=context;
const g=RR.game;
const step=(n=1)=>{for(let i=0;i<n;i++)g.update(1/60);};
const press=(...keys)=>{RR.input.keys=new Set(keys);};
for(let mission=0;mission<3;mission++){
 g.start(mission);press('w');step(240);assert.ok(g.plane.vx>75,'takeoff speed');press('w','a');step(20);press('w');step(160);assert.equal(g.plane.grounded,false);assert.equal(g.plane.hp,100);assert.ok(g.plane.y>180,'climbing');
 press(' ');let b=g.plane.boost;step(30);assert.ok(g.plane.boost<b,'boost drain');press();step(60);assert.ok(g.plane.boost>b-20,'boost regeneration');
 g.plane.vx=30;g.plane.throttle=0;g.plane.pitch=.2;step(1);assert.ok(g.plane.stall);assert.ok(g.plane.pitch<.2,'stall nose drop');
 g.draw();
}
g.start(0);
for(const r of g.world.rings)assert.ok(r.y-r.r-g.world.ground(r.x)>20,'ring clears terrain');
let r=g.world.rings[0];Object.assign(g.plane,{x:r.x-1,y:r.y,vx:100,grounded:false});press();step();assert.equal(g.rings,1);assert.equal(g.score,200);step();assert.equal(g.score,200,'no repeat ring reward');
g.start(1);let strip=g.world.runways[1];Object.assign(g.plane,{x:strip.x+200,y:strip.h+15.1,vx:90,vy:-12,pitch:0,grounded:false});step();assert.equal(g.state,'win','rescue landing completes');
g.start(2);strip=g.world.runways[1];Object.assign(g.plane,{x:strip.x+200,y:strip.h+15.1,vx:90,vy:-12,pitch:0,grounded:false});step();assert.equal(g.state,'win','delivery landing completes');
g.start(0);Object.assign(g.plane,{x:900,y:g.world.ground(900)+15.1,vx:170,vy:-65,grounded:false});step();assert.ok(g.plane.hp<100,'terrain damage');let hp=g.plane.hp;g.plane.damage(50,g);assert.equal(g.plane.hp,hp,'hit cooldown');
g.start(0);g.rings=8;strip=g.world.runways[1];Object.assign(g.plane,{x:strip.x+200,y:strip.h+15.1,vx:90,vy:-12,pitch:0,grounded:false});step();assert.equal(g.state,'win','ring route landing completes');
g.start(0);strip=g.world.runways[1];Object.assign(g.plane,{x:strip.x+200,y:strip.h+15.1,vx:90,vy:-12,pitch:0,grounded:false});step();assert.equal(g.state,'over','missing rings cannot complete');
g.start(0);let balloon=g.world.balloons[0];Object.assign(g.plane,{x:balloon.x,y:balloon.y+Math.sin(balloon.x)*12,vx:100,grounded:false});step();assert.ok(g.plane.hp<100,'balloon damage');
g.start(0);Object.assign(g.plane,{fuel:40,hp:40});step(60);assert.ok(g.plane.fuel>40&&g.plane.hp>40,'strip servicing');
RR.input.pressed.add('p');step();let x=g.plane.x;step(60);assert.equal(g.plane.x,x,'pause freezes physics');RR.input.pressed.add('p');step();assert.equal(g.state,'play');
RR.input.pressed.add('escape');step();assert.equal(g.state,'title');RR.input.pressed.add('3');step();assert.equal(g.selected,2);RR.input.pressed.add('enter');step();assert.equal(g.world.mission,2);
RR.input.drag=true;RR.input.pointer.y=686;step();assert.equal(g.plane.throttle,1,'mouse throttle');RR.input.drag=false;
for(const shot of ['title','cover','takeoff','canyon','landing']){context.location.search=`?shot=${shot}&seed=7`;RR.pose(g);g.draw();assert.ok(g.posed);}
console.log('PASS: three mission takeoffs, stalls, boost, ring clearance/scoring, rescue/delivery landings, damage cooldown, servicing, pause/menu, mouse throttle, and all five pose render paths.');
