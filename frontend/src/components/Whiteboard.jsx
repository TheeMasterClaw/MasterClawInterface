import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Whiteboard.css';

const COLORS = [
  { name: 'black', value: '#1a1a1a' },
  { name: 'red', value: '#e74c3c' },
  { name: 'blue', value: '#3498db' },
  { name: 'green', value: '#27ae60' },
  { name: 'purple', value: '#9b59b6' },
  { name: 'orange', value: '#f39c12' },
  { name: 'white', value: '#ffffff' }
];

const BRUSH_SIZES = [2, 4, 8, 12, 20];

export default function Whiteboard({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#1a1a1a');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen'); // pen, eraser
  const [savedDrawings, setSavedDrawings] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [drawingName, setDrawingName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load saved drawings from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-whiteboard-drawings');
      if (saved) {
        try {
          setSavedDrawings(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved drawings:', e);
        }
      }
    }
  }, [isOpen]);

  // Initialize canvas size
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updateSize = () => {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          setCanvasSize({
            width: Math.max(800, rect.width - 40),
            height: Math.max(500, rect.height - 100)
          });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [isOpen]);

  // Initialize canvas context
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set initial drawing styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen, canvasSize]);

  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [getCoordinates]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : currentColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, brushSize, currentColor, tool, getCoordinates]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.closePath();
      }
      setIsDrawing(false);
    }
  }, [isDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const name = drawingName.trim() || `Drawing ${savedDrawings.length + 1}`;
    
    const newDrawing = {
      id: Date.now(),
      name,
      dataUrl,
      createdAt: new Date().toISOString(),
      width: canvas.width,
      height: canvas.height
    };
    
    const updated = [...savedDrawings, newDrawing];
    setSavedDrawings(updated);
    localStorage.setItem('mc-whiteboard-drawings', JSON.stringify(updated));
    setShowSaveDialog(false);
    setDrawingName('');
  };

  const loadDrawing = (drawing) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = drawing.dataUrl;
    setShowGallery(false);
  };

  const deleteDrawing = (id) => {
    const updated = savedDrawings.filter(d => d.id !== id);
    setSavedDrawings(updated);
    localStorage.setItem('mc-whiteboard-drawings', JSON.stringify(updated));
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          alert('Drawing copied to clipboard!');
        }
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="whiteboard-overlay" onClick={onClose}>
      <div className="whiteboard-panel" onClick={e => e.stopPropagation()}>
        <div className="whiteboard-header">
          <h3>🎨 Whiteboard</h3>
          <div className="header-actions">
            <button 
              className="action-btn"
              onClick={() => setShowGallery(true)}
              title="Open Gallery"
            >
              🖼️ Gallery
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowSaveDialog(true)}
              title="Save Drawing"
            >
              💾 Save
            </button>
            <button 
              className="action-btn"
              onClick={downloadDrawing}
              title="Download as PNG"
            >
              ⬇️ Export
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="whiteboard-toolbar">
          <div className="toolbar-section">
            <label>Tool:</label>
            <div className="tool-buttons">
              <button
                className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
                onClick={() => setTool('pen')}
                title="Pen"
              >
                ✏️ Pen
              </button>
              <button
                className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                onClick={() => setTool('eraser')}
                title="Eraser"
              >
                🧹 Eraser
              </button>
            </div>
          </div>

          <div className="toolbar-section">
            <label>Color:</label>
            <div className="color-palette">
              {COLORS.map(color => (
                <button
                  key={color.name}
                  className={`color-btn ${currentColor === color.value ? 'active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    setCurrentColor(color.value);
                    setTool('pen');
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="toolbar-section">
            <label>Size:</label>
            <div className="size-selector">
              {BRUSH_SIZES.map(size => (
                <button
                  key={size}
                  className={`size-btn ${brushSize === size ? 'active' : ''}`}
                  onClick={() => setBrushSize(size)}
                  title={`${size}px`}
                >
                  <div 
                    className="size-preview" 
                    style={{ 
                      width: size, 
                      height: size,
                      backgroundColor: tool === 'eraser' ? '#ccc' : currentColor
                    }} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-section">
            <button className="clear-btn" onClick={clearCanvas}>
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="whiteboard-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="whiteboard-footer">
          <span className="canvas-info">
            {canvasSize.width} × {canvasSize.height}px | {tool === 'eraser' ? 'Eraser' : 'Pen'} {brushSize}px
          </span>
          <span className="shortcut-hint">
            Click and drag to draw • Right-click to erase
          </span>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h4>💾 Save Drawing</h4>
            <input
              type="text"
              placeholder="Enter drawing name..."
              value={drawingName}
              onChange={(e) => setDrawingName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveDrawing()}
              autoFocus
            />
            <div className="dialog-actions">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button className="primary" onClick={saveDrawing}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {showGallery && (
        <div className="dialog-overlay" onClick={() => setShowGallery(false)}>
          <div className="gallery-dialog" onClick={e => e.stopPropagation()}>
            <div className="gallery-header">
              <h4>🖼️ Saved Drawings</h4>
              <button className="close-btn" onClick={() => setShowGallery(false)}>×</button>
            </div>
            {savedDrawings.length === 0 ? (
              <div className="gallery-empty">
                <p>No saved drawings yet.</p>
                <p>Create something and save it!</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {savedDrawings.map(drawing => (
                  <div key={drawing.id} className="gallery-item">
                    <img 
                      src={drawing.dataUrl} 
                      alt={drawing.name}
                      onClick={() => loadDrawing(drawing)}
                    />
                    <div className="gallery-item-info">
                      <span className="gallery-item-name">{drawing.name}</span>
                      <span className="gallery-item-date">
                        {new Date(drawing.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="gallery-item-actions">
                      <button onClick={() => loadDrawing(drawing)} title="Load">
                        📂 Open
                      </button>
                      <button onClick={() => deleteDrawing(drawing.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
