RR.input={keys:new Set(),pressed:new Set(),pointer:{x:0,y:0,down:false,click:false},drag:false,
 init(canvas){
  const pos=e=>{const r=canvas.getBoundingClientRect();const scale=Math.min(r.width/1280,r.height/800);return{x:(e.clientX-r.left-(r.width-1280*scale)/2)/scale,y:(e.clientY-r.top-(r.height-800*scale)/2)/scale};};
  window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab'].includes(k))e.preventDefault();if(!this.keys.has(k))this.pressed.add(k);this.keys.add(k);RR.audio.start();});
  window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{this.keys.clear();this.drag=false;if(RR.game&&RR.game.state==='play')RR.game.state='pause';});
  canvas.addEventListener('pointerdown',e=>{Object.assign(this.pointer,pos(e),{down:true,click:true});this.drag=this.pointer.x>1110&&this.pointer.y>660;canvas.setPointerCapture(e.pointerId);RR.audio.start();});
  canvas.addEventListener('pointermove',e=>Object.assign(this.pointer,pos(e)));
  canvas.addEventListener('pointerup',()=>{this.pointer.down=false;this.drag=false;});
  canvas.addEventListener('pointercancel',()=>{this.pointer.down=false;this.drag=false;});
 },
 held(...k){return k.some(x=>this.keys.has(x));},tap(k){return this.pressed.has(k);},end(){this.pressed.clear();this.pointer.click=false;}
};
