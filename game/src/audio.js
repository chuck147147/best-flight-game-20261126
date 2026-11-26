/* All sound is built from oscillators; no samples or downloads. */
window.RR = window.RR || {};
RR.audio = {
  ctx:null, muted:false,
  start(){
    if(this.ctx){this.ctx.resume();return;}
    try{
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx=new C();this.gain=this.ctx.createGain();this.gain.gain.value=0;
      this.engine=this.ctx.createOscillator();this.engine.type='sawtooth';
      const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=240;
      this.engine.connect(filter);filter.connect(this.gain);this.gain.connect(this.ctx.destination);this.engine.start();
    }catch(e){/* Flight remains available if audio is disabled. */}
  },
  update(p,active){if(!this.ctx)return;const t=this.ctx.currentTime;this.engine.frequency.setTargetAtTime(38+p.throttle*65+(p.boosting?35:0),t,.1);this.gain.gain.setTargetAtTime(active&&!this.muted?.025+p.throttle*.045:0,t,.15);},
  note(hz,duration=.2,volume=.08){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration);},
  ring(){this.note(660,.3);setTimeout(()=>this.note(990,.4),90);},
  hit(){this.note(65,.35,.16);},
  win(){[523,659,784,1047].forEach((n,i)=>setTimeout(()=>this.note(n,.5),i*130));}
};
