// src/components/Notes/DrawingCanvas.jsx
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios'; // Import axios for direct Cloudinary upload
import api from '../../services/apiClient';
import toast from 'react-hot-toast';



export default function DrawingCanvas({ onInsert, onClose }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // pen,line,rect,circle,eraser
  const [color, setColor] = useState('#111827');
  const [width, setWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
  }, [color, width]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function pushUndo() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    undoStack.current.push(canvas.toDataURL());
    if (undoStack.current.length > 30) undoStack.current.shift();
    redoStack.current = [];
  }

  function restoreFromDataURL(dataUrl) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
      ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
    };
    img.src = dataUrl;
  }

  function handleDown(e) {
    e.preventDefault();
    const pt = getPoint(e);
    setIsDrawing(true);
    setStartPos(pt);
    pushUndo();
    const ctx = canvasRef.current.getContext('2d');
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
      else ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
    }
  }

  function handleMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      return;
    }
    // shape preview
    const snapshot = undoStack.current[undoStack.current.length - 1];
    if (snapshot) restoreFromDataURL(snapshot);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    const s = startPos;
    if (!s) return;
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(s.x, s.y, pt.x - s.x, pt.y - s.y);
    } else if (tool === 'circle') {
      const dx = pt.x - s.x;
      const dy = pt.y - s.y;
      const r = Math.sqrt(dx*dx + dy*dy);
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function handleUp(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    if (tool === 'pen' || tool === 'eraser') {
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const snapshot = undoStack.current[undoStack.current.length - 1];
      if (snapshot) restoreFromDataURL(snapshot);
      ctx.save();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      const s = startPos;
      if (!s) return;
      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(s.x, s.y, pt.x - s.x, pt.y - s.y);
      } else if (tool === 'circle') {
        const dx = pt.x - s.x;
        const dy = pt.y - s.y;
        const r = Math.sqrt(dx*dx + dy*dy);
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    }
    setIsDrawing(false);
    setStartPos(null);
  }

  function handleUndo() {
    if (undoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const cur = canvas.toDataURL();
    redoStack.current.push(cur);
    const prev = undoStack.current.pop();
    restoreFromDataURL(prev);
  }

  function handleRedo() {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    pushUndo();
    restoreFromDataURL(next);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    pushUndo();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
  }

  // This function is needed for the download button
  function exportDataUrl() {
    const canvas = canvasRef.current;
    return canvas.toDataURL('image/png');
  }

  // This function handles the upload to the backend
  async function uploadDrawing() {
    const canvas = canvasRef.current;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    
    const fd = new FormData();
    fd.append('file', blob, 'drawing.png');
    
    try {
      // Use the imported api instance
      const resp = await api.post('/api/uploads', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const json = resp.data;
      if (json && json.url) return json.url;
      throw new Error('Backend did not return a valid URL.');
    } catch (err) {
      console.error('Upload to backend failed', err);
      throw err;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-4 w-[90%] max-w-4xl z-10">
        <div className="flex gap-2 mb-3 items-center">
          <div className="flex gap-1">
            <button className={`px-2 py-1 border rounded ${tool==='pen' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTool('pen')}>Pen</button>
            <button className={`px-2 py-1 border rounded ${tool==='line' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTool('line')}>Line</button>
            <button className={`px-2 py-1 border rounded ${tool==='rect' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTool('rect')}>Rect</button>
            <button className={`px-2 py-1 border rounded ${tool==='circle' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTool('circle')}>Circle</button>
            <button className={`px-2 py-1 border rounded ${tool==='eraser' ? 'bg-indigo-600 text-white' : ''}`} onClick={()=>setTool('eraser')}>Eraser</button>
          </div>

          <label className="flex items-center gap-2 ml-3">
            <span className="text-sm">Color</span>
            <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm">Width</span>
            <input type="range" min="1" max="40" value={width} onChange={(e)=>setWidth(Number(e.target.value))} />
          </label>

          <button className="px-2 py-1 border rounded" onClick={handleUndo}>Undo</button>
          <button className="px-2 py-1 border rounded" onClick={handleRedo}>Redo</button>
          <button className="px-2 py-1 border rounded" onClick={clearCanvas}>Clear</button>

          <div className="ml-auto flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={async ()=>{
              const uploaded = await uploadDrawing();
              onInsert && onInsert(uploaded);
            }}>Insert drawing</button>
            <button className="px-3 py-1 border rounded" onClick={()=>{ const a = document.createElement('a'); a.href=exportDataUrl(); a.download='drawing.png'; a.click(); }}>Download</button>
            <button className="px-3 py-1 border rounded" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="border rounded overflow-hidden" style={{height: 420}}>
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
            style={{background:'white', width:'100%', height:'100%', touchAction:'none'}}
          />
        </div>
      </div>
    </div>
  );
}
