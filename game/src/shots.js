/* Poses use the actual world, plane and HUD renderers. No screenshot-only artwork. */
RR.pose=function(g){const query=new URLSearchParams(location.search),name=query.get('shot');if(!name)return false;const seed=Number(query.get('seed')||7);g.start(name==='landing'?1:0,Number.isFinite(seed)?seed:7);g.posed=true;g.time=18;const p=g.plane;
 if(name==='title'){g.state='title';p.x=1600;p.y=340;p.pitch=.08;p.vx=145;p.grounded=false;}
 else if(name==='takeoff'){p.x=290;p.y=110;p.vx=79;p.throttle=.94;p.pitch=.06;p.grounded=true;g.message='ALDER FIELD  /  CLEAR FOR TAKEOFF';}
 else if(name==='canyon'){p.x=2920;p.y=g.world.ground(p.x)+76;p.vx=187;p.pitch=-.07;p.throttle=.78;p.grounded=false;g.rings=3;g.score=600;g.world.rings.slice(0,3).forEach(r=>r.hit=true);g.message='LOW PASS  /  MIND THE RIDGELINE';}
 else if(name==='landing'){p.x=g.world.end-350;p.y=145;p.vx=62;p.throttle=.15;p.grounded=true;g.score=1240;g.message='MISSION COMPLETE  /  HIKER SAFELY HOME';g.rings=0;}
 else{p.x=590;p.y=315;p.vx=145;p.pitch=.09;p.throttle=.72;p.grounded=false;g.message='THE GOLDEN TRAIL  /  FIND YOUR FLOW';}
 p.fuel=name==='landing'?57:86;g.messageTime=99;g.camera={x:p.x-365,y:Math.max(0,p.y-370)};return true;
};
