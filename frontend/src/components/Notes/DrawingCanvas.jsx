// src/components/Notes/DrawingCanvas.jsx
import React, { useRef, useState, useEffect } from 'react';
import api from '../../services/apiClient';

export default function DrawingCanvas({ onInsert, onClose }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // pen,line,rect,circle,eraser
  const [color, setColor] = useState('#111827');
  const [width, setWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const snapshotImageData = useRef(null); // Synchronous snapshot for shape previews
  const dprRef = useRef(1);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
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
    const clientX = e.clientX;
    const clientY = e.clientY;
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
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = dataUrl;
  }

  function handleDown(e) {
    e.preventDefault();
    try {
      if (e.target && e.pointerId != null && e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch (err) {}

    const pt = getPoint(e);
    setIsDrawing(true);
    setStartPos(pt);
    pushUndo();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      try {
        snapshotImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (err) {
        snapshotImageData.current = null;
      }
    }

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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      return;
    }

    if (snapshotImageData.current) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(snapshotImageData.current, 0, 0);
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    }

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
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function handleUp(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getPoint(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      if (snapshotImageData.current) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(snapshotImageData.current, 0, 0);
        ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      }
      ctx.save();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      const s = startPos;
      if (s) {
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
          const r = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    try {
      if (e.target && e.pointerId != null && e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    snapshotImageData.current = null;
    setIsDrawing(false);
    setStartPos(null);
  }

  function handleCancel(e) {
    if (!isDrawing) return;
    try {
      if (e.target && e.pointerId != null && e.target.releasePointerCapture) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    snapshotImageData.current = null;
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
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  function exportDataUrl() {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const temp = document.createElement('canvas');
    temp.width = Math.round(rect.width * dprRef.current);
    temp.height = Math.round(rect.height * dprRef.current);
    const tctx = temp.getContext('2d');
    tctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    tctx.drawImage(canvas, 0, 0, rect.width, rect.height);
    return temp.toDataURL('image/png');
  }

  async function uploadDrawing() {
    const canvas = canvasRef.current;
    const dataUrl = exportDataUrl();
    const blob = await (await fetch(dataUrl)).blob();
    const fd = new FormData();
    fd.append('file', blob, 'drawing.png');
    try {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* 1. Modal container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-7xl h-[90vh] z-10 flex flex-col p-4 space-y-3">
        
        {/* 2. Single, combined top bar for ALL controls */}
        <div className="flex-shrink-0 flex flex-wrap justify-between items-center gap-2 pb-3 border-b dark:border-gray-700">
          
          {/* Left Side: Drawing Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold dark:text-white hidden md:block">Editor Tools:</h3>
            
            {/* Tool buttons */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
              <button title="Pen" className={`px-2 py-1 rounded ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} onClick={() => setTool('pen')}>Pen</button>
              <button title="Line" className={`px-2 py-1 rounded ${tool === 'line' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} onClick={() => setTool('line')}>Line</button>
              <button title="Rectangle" className={`px-2 py-1 rounded ${tool === 'rect' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} onClick={() => setTool('rect')}>Rect</button>
              <button title="Circle" className={`px-2 py-1 rounded ${tool === 'circle' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} onClick={() => setTool('circle')}>Circle</button>
              <button title="Eraser" className={`px-2 py-1 rounded ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} onClick={() => setTool('eraser')}>Eraser</button>
            </div>

            {/* Color & Width */}
            <div className="flex gap-3 items-center p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
              <label title="Color" className="flex items-center gap-1 cursor-pointer">
                <span className="text-sm sr-only">Color</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 border-none cursor-pointer" />
              </label>
              <label title="Width" className="flex items-center gap-1">
                <span className="text-sm sr-only">Width</span>
                <input type="range" min="1" max="40" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-24" />
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
              <button title="Undo" className="px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={handleUndo}>Undo</button>
              <button title="Redo" className="px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={handleRedo}>Redo</button>
              <button title="Clear" className="px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={clearCanvas}>Clear</button>
            </div>
          </div>
          
          {/* Right Side: Main Actions */}
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded shadow-sm hover:bg-green-700" onClick={async () => {
              const uploaded = await uploadDrawing();
              onInsert && onInsert(uploaded);
            }}>Insert</button>
            <button className="px-3 py-1 border rounded dark:text-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { const a = document.createElement('a'); a.href = exportDataUrl(); a.download = 'drawing.png'; a.click(); }}>Download</button>
            <button className="px-3 py-1 border rounded dark:text-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onClose}>Close</button>
          </div>
        </div>
        
        {/* 3. Canvas Container (grows to fill remaining space) */}
        <div className="relative flex-1 w-full h-full rounded-lg overflow-hidden bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full h-full" // Fills the relative parent
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleCancel}
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
