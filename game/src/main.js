/* Fixed-step simulation with independent presentation. Classic scripts support file://. */
(()=>{
 const canvas=document.getElementById('game'),c=canvas.getContext('2d',{alpha:false});
 const game={state:'title',selected:0,best:0,score:0,rings:0,time:0,shake:0,message:'',messageTime:0,particles:[],camera:{x:0,y:0},posed:false,
 start(mission=this.selected,seed=7){this.selected=mission;this.world=new RR.World(mission,seed);this.plane=new RR.Plane(this.world);this.state='play';this.time=0;this.score=0;this.rings=0;this.shake=0;this.particles=[];this.result='';this.message='W / POWER UP     A / ROTATE AT 50 KT';this.messageTime=7;this.camera={x:this.plane.x-365,y:0};},
 finish(won,reason){if(this.state!=='play')return;this.state=won?'win':'over';if(won){let bonus=Math.max(0,Math.round(1000-this.time*3));this.score+=bonus;this.result=`Safe arrival. +${bonus} time bonus. Welcome home, pilot.`;RR.audio.win();}else{this.result=reason;RR.audio.hit();}this.best=Math.max(this.best,this.score);try{localStorage.setItem('ridge-runner-best',String(this.best));}catch(e){}},
 update(dt){const i=RR.input;
  if(i.tap('m'))RR.audio.muted=!RR.audio.muted;
  if(i.tap('escape')){this.state='title';this.posed=false;}
  if(i.tap('r')){this.posed=false;this.start();}
  if(i.tap('p')){if(this.state==='play')this.state='pause';else if(this.state==='pause')this.state='play';}
  if(this.state==='title'){
   for(let n=1;n<=3;n++)if(i.tap(String(n)))this.selected=n-1;
   if(i.pointer.click){let {x,y}=i.pointer;if(x>=754&&x<=1215&&y>=123&&y<=503)this.selected=Math.min(2,Math.floor((y-123)/133));if(x>=65&&x<=377&&y>=428&&y<=485)this.start();}
   if(i.tap('enter'))this.start();
  }else if(['win','over','pause'].includes(this.state)&&i.pointer.click&&i.pointer.x>=465&&i.pointer.x<=815&&i.pointer.y>=423&&i.pointer.y<=472){if(this.state==='pause')this.state='play';else this.start();}
  if(this.state==='play'&&!this.posed){this.time+=dt;this.plane.update(dt,this);this.messageTime=Math.max(0,this.messageTime-dt);this.shake=Math.max(0,this.shake-dt*22);this.camera.x+=(this.plane.x-365-this.camera.x)*Math.min(1,dt*4);this.camera.y+=(Math.max(0,this.plane.y-370)-this.camera.y)*Math.min(1,dt*2);for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);}
  RR.audio.update(this.plane,this.state==='play'&&!this.posed);i.end();
 },
 draw(){c.save();if(this.shake)c.translate(Math.sin(this.time*95)*this.shake,Math.cos(this.time*77)*this.shake*.5);this.world.draw(c,this.camera,this.time);for(const p of this.particles){c.fillStyle='#ffdf8e';c.globalAlpha=p.life;c.fillRect(p.x-this.camera.x,560-(p.y-this.camera.y),4,4);}c.globalAlpha=1;this.plane.draw(c,this.camera,this.time);c.restore();RR.ui.draw(c,this);if(this.state==='title')RR.ui.title(c,this);else if(['pause','win','over'].includes(this.state))RR.ui.overlay(c,this);}
 };
 try{game.best=Math.max(0,Number(localStorage.getItem('ridge-runner-best'))||0);}catch(e){}
 RR.game=game;RR.input.init(canvas);game.start();game.state='title';RR.pose(game);canvas.focus();let last=0,acc=0;
 function loop(ms){let delta=Math.min(.1,(ms-last)/1000||0);last=ms;acc+=delta;while(acc>=1/60){game.update(1/60);acc-=1/60;}game.draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
})();
