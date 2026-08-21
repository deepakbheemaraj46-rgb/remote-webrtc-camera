const express=require('express'),http=require('http'),WebSocket=require('ws'),path=require('path');
const app=express(),server=http.createServer(app),wss=new WebSocket.Server({server});
app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "camera.html"));
});
app.get('/health',(q,r)=>r.json({ok:true}));
const rooms=new Map();
wss.on('connection',ws=>{
 let roomId;
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
  if(m.type==='join'){roomId=String(m.room||'demo');if(!rooms.has(roomId))rooms.set(roomId,new Set());const room=rooms.get(roomId);room.add(ws);ws.send(JSON.stringify({type:'joined',peers:room.size-1}));return}
  if(!roomId||!rooms.has(roomId))return;
  for(const p of rooms.get(roomId))if(p!==ws&&p.readyState===WebSocket.OPEN)p.send(JSON.stringify(m));
 });
 ws.on('close',()=>{if(!roomId||!rooms.has(roomId))return;const r=rooms.get(roomId);r.delete(ws);for(const p of r)if(p.readyState===WebSocket.OPEN)p.send(JSON.stringify({type:'peer-left'}));if(!r.size)rooms.delete(roomId)});
});
server.listen(process.env.PORT||3000,'0.0.0.0');
