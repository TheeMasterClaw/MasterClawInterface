import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CodePlayground.css';

const STORAGE_KEY = 'mc-code-playground';
const SNIPPETS_KEY = 'mc-code-snippets';

const SAMPLE_SNIPPETS = [
  {
    id: 'sample-1',
    name: 'Array Methods Demo',
    description: 'Common array operations',
    code: `const numbers = [1, 2, 3, 4, 5];

// Map: double each number
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Filter: get even numbers
const evens = numbers.filter(n => n % 2 === 0);
console.log('Evens:', evens);

// Reduce: sum all numbers
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log('Sum:', sum);

// Find first number greater than 3
const firstBig = numbers.find(n => n > 3);
console.log('First > 3:', firstBig);`,
    language: 'javascript',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    name: 'Date Formatter',
    description: 'Format dates in different styles',
    code: `const now = new Date();

// ISO format
console.log('ISO:', now.toISOString());

// Locale string
console.log('Locale:', now.toLocaleString());

// Custom format
const options = { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
};
console.log('Custom:', now.toLocaleDateString('en-US', options));

// Time only
console.log('Time:', now.toLocaleTimeString());`,
    language: 'javascript',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    name: 'Random Generator',
    description: 'Generate random numbers and colors',
    code: `// Random integer between min and max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log('Random 1-100:', randomInt(1, 100));
console.log('Random 1-6 (dice):', randomInt(1, 6));

// Random hex color
function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

console.log('Random colors:');
for (let i = 0; i < 5; i++) {
  console.log(randomColor());
}

// Random element from array
const fruits = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
console.log('Random fruit:', randomFruit);`,
    language: 'javascript',
    createdAt: new Date().toISOString()
  }
];

const CodePlayground = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [viewMode, setViewMode] = useState('editor'); // 'editor', 'snippets', 'help'
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [snippetDesc, setSnippetDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const editorRef = useRef(null);
  const outputEndRef = useRef(null);

  // Load snippets on mount
  useEffect(() => {
    if (!isOpen) return;
    
    const savedSnippets = localStorage.getItem(SNIPPETS_KEY);
    if (savedSnippets) {
      try {
        setSnippets(JSON.parse(savedSnippets));
      } catch (e) {
        console.error('Failed to load snippets:', e);
        setSnippets(SAMPLE_SNIPPETS);
        localStorage.setItem(SNIPPETS_KEY, JSON.stringify(SAMPLE_SNIPPETS));
      }
    } else {
      setSnippets(SAMPLE_SNIPPETS);
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(SAMPLE_SNIPPETS));
    }

    // Load saved code
    const savedCode = localStorage.getItem(STORAGE_KEY);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(`// Welcome to Code Playground! 🚀
// Write JavaScript code and click Run to execute

console.log('Hello, MasterClaw!');

// Try some examples:
const greeting = (name) => \`Hello, \${name}!\`;
console.log(greeting('Developer'));

// Current timestamp
console.log('Current time:', new Date().toLocaleString());

// Simple calculation
const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
console.log('5! =', factorial(5));
`);
    }
  }, [isOpen]);

  // Auto-save code
  useEffect(() => {
    if (code) {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, [code]);

  // Save snippets
  useEffect(() => {
    if (snippets.length > 0) {
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
    }
  }, [snippets]);

  // Scroll to bottom of output
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (code.trim()) {
          setShowSaveModal(true);
        }
      }
      if (e.key === 'Escape' && showSaveModal) {
        setShowSaveModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code, showSaveModal]);

  const runCode = useCallback(() => {
    if (!code.trim() || isRunning) return;
    
    setIsRunning(true);
    const logs = [];
    const startTime = performance.now();

    // Custom console implementation
    const customConsole = {
      log: (...args) => {
        logs.push({
          type: 'log',
          content: args.map(arg => formatValue(arg)).join(' '),
          timestamp: new Date().toLocaleTimeString()
        });
      },
      error: (...args) => {
        logs.push({
          type: 'error',
          content: args.map(arg => formatValue(arg)).join(' '),
          timestamp: new Date().toLocaleTimeString()
        });
      },
      warn: (...args) => {
        logs.push({
          type: 'warn',
          content: args.map(arg => formatValue(arg)).join(' '),
          timestamp: new Date().toLocaleTimeString()
        });
      },
      info: (...args) => {
        logs.push({
          type: 'info',
          content: args.map(arg => formatValue(arg)).join(' '),
          timestamp: new Date().toLocaleTimeString()
        });
      },
      table: (data) => {
        logs.push({
          type: 'table',
          content: formatTable(data),
          timestamp: new Date().toLocaleTimeString()
        });
      },
      time: (label) => {
        logs.push({
          type: 'log',
          content: `⏱️ Timer "${label}" started`,
          timestamp: new Date().toLocaleTimeString()
        });
      },
      timeEnd: (label) => {
        logs.push({
          type: 'log',
          content: `⏱️ Timer "${label}" ended`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    };

    try {
      // Create function with custom console
      const func = new Function('console', code);
      func(customConsole);
      
      const endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);
      
      logs.push({
        type: 'success',
        content: `✓ Executed successfully in ${executionTime}ms`,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      logs.push({
        type: 'error',
        content: `✗ ${error.name}: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    setOutput(prev => [...prev, {
      id: Date.now(),
      code: code.trim(),
      logs,
      executedAt: new Date().toLocaleString()
    }]);
    setIsRunning(false);
  }, [code, isRunning]);

  const formatValue = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      const items = value.map(v => formatValue(v)).join(', ');
      return `[${items}]`;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Object]';
      }
    }
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    return String(value);
  };

  const formatTable = (data) => {
    if (!Array.isArray(data)) return formatValue(data);
    if (data.length === 0) return '(empty array)';
    
    const keys = Object.keys(data[0]);
    if (keys.length === 0) return '(empty objects)';
    
    let result = '┌' + '─'.repeat(40) + '┐\n';
    result += '│ ' + keys.join(' │ ') + ' │\n';
    result += '├' + '─'.repeat(40) + '┤\n';
    
    data.slice(0, 10).forEach(row => {
      const values = keys.map(k => String(row[k] ?? '').substring(0, 10).padEnd(10));
      result += '│ ' + values.join(' │ ') + ' │\n';
    });
    
    if (data.length > 10) {
      result += `│ ... and ${data.length - 10} more rows\n`;
    }
    
    result += '└' + '─'.repeat(40) + '┘';
    return result;
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const clearEditor = () => {
    if (confirm('Clear all code?')) {
      setCode('');
    }
  };

  const saveSnippet = () => {
    if (!snippetName.trim() || !code.trim()) return;
    
    const newSnippet = {
      id: 'snippet-' + Date.now(),
      name: snippetName.trim(),
      description: snippetDesc.trim(),
      code: code.trim(),
      language: 'javascript',
      createdAt: new Date().toISOString()
    };
    
    setSnippets(prev => [newSnippet, ...prev]);
    setSnippetName('');
    setSnippetDesc('');
    setShowSaveModal(false);
    setViewMode('snippets');
  };

  const loadSnippet = (snippet) => {
    if (code.trim() && code !== snippet.code) {
      if (!confirm('Replace current code? Unsaved changes will be lost.')) {
        return;
      }
    }
    setCode(snippet.code);
    setSelectedSnippet(snippet);
    setViewMode('editor');
  };

  const deleteSnippet = (snippetId) => {
    if (confirm('Delete this snippet?')) {
      setSnippets(prev => prev.filter(s => s.id !== snippetId));
      if (selectedSnippet?.id === snippetId) {
        setSelectedSnippet(null);
      }
    }
  };

  const insertTemplate = (template) => {
    const templates = {
      function: `function myFunction(param1, param2) {
  // Your code here
  return param1 + param2;
}

console.log(myFunction(1, 2));`,
      arrow: `const myFunction = (param1, param2) => {
  // Your code here
  return param1 + param2;
};

console.log(myFunction(1, 2));`,
      loop: `const items = ['a', 'b', 'c'];

// For loop
for (let i = 0; i < items.length; i++) {
  console.log('Index', i, ':', items[i]);
}

// For...of
for (const item of items) {
  console.log('Item:', item);
}

// forEach
items.forEach((item, index) => {
  console.log(index, item);
});`,
      fetch: `// Example fetch request
const fetchData = async () => {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

fetchData();`,
      class: `class MyClass {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return \`Hello, \${this.name}!\`;
  }
}

const instance = new MyClass('World');
console.log(instance.greet());`,
      timeout: `// Delayed execution
console.log('Starting...');

setTimeout(() => {
  console.log('Executed after 1 second!');
}, 1000);

// Interval (stops after 5 times)
let count = 0;
const interval = setInterval(() => {
  count++;
  console.log('Tick', count);
  if (count >= 5) {
    clearInterval(interval);
    console.log('Stopped');
  }
}, 500);`
    };

    const templateCode = templates[template] || '';
    const cursorPosition = editorRef.current?.selectionStart || code.length;
    const newCode = code.slice(0, cursorPosition) + '\n' + templateCode + '\n' + code.slice(cursorPosition);
    setCode(newCode);
  };

  const filteredSnippets = snippets.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLineNumbers = () => {
    const lines = code.split('\n').length;
    return Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="code-playground-overlay" onClick={onClose}>
      <div className="code-playground-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="code-playground-header">
          <h2>💻 Code Playground</h2>
          <div className="header-actions">
            <div className="view-tabs">
              <button 
                className={viewMode === 'editor' ? 'active' : ''}
                onClick={() => setViewMode('editor')}
              >
                Editor
              </button>
              <button 
                className={viewMode === 'snippets' ? 'active' : ''}
                onClick={() => setViewMode('snippets')}
              >
                Snippets ({snippets.length})
              </button>
              <button 
                className={viewMode === 'help' ? 'active' : ''}
                onClick={() => setViewMode('help')}
              >
                Help
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Editor View */}
        {viewMode === 'editor' && (
          <div className="code-playground-content">
            {/* Toolbar */}
            <div className="editor-toolbar">
              <div className="toolbar-left">
                <button 
                  className="run-btn"
                  onClick={runCode}
                  disabled={isRunning || !code.trim()}
                >
                  {isRunning ? '⏳ Running...' : '▶ Run (Ctrl+Enter)'}
                </button>
                <button onClick={clearEditor} title="Clear editor">🗑️ Clear</button>
                <button onClick={() => setShowSaveModal(true)} title="Save snippet">💾 Save</button>
              </div>
              <div className="toolbar-right">
                <select onChange={(e) => insertTemplate(e.target.value)} defaultValue="">
                  <option value="" disabled>📋 Insert Template...</option>
                  <option value="function">Function</option>
                  <option value="arrow">Arrow Function</option>
                  <option value="loop">Loop Examples</option>
                  <option value="fetch">Fetch API</option>
                  <option value="class">Class</option>
                  <option value="timeout">Timers</option>
                </select>
                <button 
                  className={lineNumbers ? 'active' : ''}
                  onClick={() => setLineNumbers(!lineNumbers)}
                  title="Toggle line numbers"
                >
                  #
                </button>
                <button 
                  className={wrapLines ? 'active' : ''}
                  onClick={() => setWrapLines(!wrapLines)}
                  title="Toggle line wrap"
                >
                  ↵
                </button>
                <select 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  title="Font size"
                >
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                </select>
              </div>
            </div>

            {/* Editor Area */}
            <div className="editor-container">
              {lineNumbers && (
                <div className="line-numbers" style={{ fontSize: `${fontSize}px` }}>
                  {getLineNumbers().map(num => (
                    <span key={num}>{num}</span>
                  ))}
                </div>
              )}
              <textarea
                ref={editorRef}
                className="code-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write your JavaScript code here..."
                spellCheck={false}
                style={{ 
                  fontSize: `${fontSize}px`,
                  whiteSpace: wrapLines ? 'pre-wrap' : 'pre'
                }}
              />
            </div>

            {/* Output Panel */}
            <div className="output-panel">
              <div className="output-header">
                <span>🖥️ Console Output</span>
                <div className="output-actions">
                  <span className="output-count">
                    {output.length} run{output.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={clearOutput} title="Clear output">Clear</button>
                </div>
              </div>
              <div className="output-content">
                {output.length === 0 ? (
                  <div className="empty-output">
                    <span>Click "Run" to see output here</span>
                  </div>
                ) : (
                  output.map((run) => (
                    <div key={run.id} className="output-run">
                      <div className="run-header">
                        <span className="run-time">{run.executedAt}</span>
                      </div>
                      <div className="run-logs">
                        {run.logs.map((log, idx) => (
                          <div key={idx} className={`log-entry ${log.type}`}>
                            <span className="log-timestamp">{log.timestamp}</span>
                            <span className="log-content">{log.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                <div ref={outputEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Snippets View */}
        {viewMode === 'snippets' && (
          <div className="snippets-view">
            <div className="snippets-header">
              <input
                type="text"
                placeholder="🔍 Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button onClick={() => {setSnippetName(''); setSnippetDesc(''); setShowSaveModal(true);}}>
                + New Snippet
              </button>
            </div>
            <div className="snippets-grid">
              {filteredSnippets.length === 0 ? (
                <div className="empty-snippets">
                  <span>No snippets found</span>
                  <button onClick={() => setViewMode('editor')}>Create your first snippet</button>
                </div>
              ) : (
                filteredSnippets.map(snippet => (
                  <div key={snippet.id} className="snippet-card">
                    <div className="snippet-header">
                      <h4>{snippet.name}</h4>
                      <div className="snippet-actions">
                        <button 
                          onClick={() => loadSnippet(snippet)}
                          title="Load"
                        >
                          📂
                        </button>
                        <button 
                          onClick={() => deleteSnippet(snippet.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="snippet-desc">{snippet.description}</p>
                    <pre className="snippet-preview">
                      {snippet.code.substring(0, 100)}
                      {snippet.code.length > 100 ? '...' : ''}
                    </pre>
                    <div className="snippet-meta">
                      <span className="snippet-lang">{snippet.language}</span>
                      <span className="snippet-date">
                        {new Date(snippet.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Help View */}
        {viewMode === 'help' && (
          <div className="help-view">
            <div className="help-section">
              <h3>🚀 Getting Started</h3>
              <p>Code Playground is a JavaScript sandbox where you can write, run, and save code snippets.</p>
              <ul>
                <li>Write JavaScript code in the editor</li>
                <li>Click "Run" or press <kbd>Ctrl+Enter</kbd> to execute</li>
                <li>View output in the console panel below</li>
                <li>Save useful snippets for later</li>
              </ul>
            </div>
            <div className="help-section">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <ul className="shortcuts-list">
                <li><kbd>Ctrl+Enter</kbd> - Run code</li>
                <li><kbd>Ctrl+S</kbd> - Save snippet</li>
                <li><kbd>Escape</kbd> - Close modal</li>
              </ul>
            </div>
            <div className="help-section">
              <h3>📦 Console Methods</h3>
              <ul>
                <li><code>console.log()</code> - General output</li>
                <li><code>console.error()</code> - Error messages</li>
                <li><code>console.warn()</code> - Warnings</li>
                <li><code>console.info()</code> - Information</li>
                <li><code>console.table()</code> - Display tabular data</li>
                <li><code>console.time()</code> / <code>console.timeEnd()</code> - Timers</li>
              </ul>
            </div>
            <div className="help-section">
              <h3>⚠️ Limitations</h3>
              <ul>
                <li>DOM access is not available</li>
                <li>Network requests are simulated (CORS restrictions)</li>
                <li>External modules cannot be imported</li>
                <li>Code runs in a sandboxed environment</li>
              </ul>
            </div>
          </div>
        )}

        {/* Save Modal */}
        {showSaveModal && (
          <div className="save-modal-overlay">
            <div className="save-modal">
              <h3>💾 Save Snippet</h3>
              <input
                type="text"
                placeholder="Snippet name..."
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)..."
                value={snippetDesc}
                onChange={(e) => setSnippetDesc(e.target.value)}
              />
              <div className="modal-actions">
                <button onClick={() => setShowSaveModal(false)}>Cancel</button>
                <button 
                  onClick={saveSnippet}
                  disabled={!snippetName.trim()}
                  className="primary"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePlayground;