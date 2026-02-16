import { Router } from 'express';
import { getDb, updateDb, genId } from '../db.js';

const router = Router();

// Get all snippets
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const snippets = db.snippets || [];
    
    // Sort by updatedAt descending (most recent first)
    const sortedSnippets = snippets.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    res.json({ 
      success: true, 
      snippets: sortedSnippets,
      count: sortedSnippets.length 
    });
  } catch (err) {
    console.error('Error fetching snippets:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch snippets' 
    });
  }
});

// Get snippet statistics (must be before /:id route)
router.get('/stats/overview', (req, res) => {
  try {
    const db = getDb();
    const snippets = db.snippets || [];
    
    const stats = {
      total: snippets.length,
      byCategory: {},
      totalUsage: 0,
      mostUsed: null
    };
    
    snippets.forEach(s => {
      // Count by category
      stats.byCategory[s.category] = (stats.byCategory[s.category] || 0) + 1;
      
      // Total usage
      stats.totalUsage += s.usageCount || 0;
      
      // Most used
      if (!stats.mostUsed || (s.usageCount || 0) > (stats.mostUsed.usageCount || 0)) {
        stats.mostUsed = s;
      }
    });
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (err) {
    console.error('Error fetching snippet stats:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    });
  }
});

// Search snippets (must be before /:id route)
router.get('/search/:query', (req, res) => {
  try {
    const db = getDb();
    const snippets = db.snippets || [];
    const query = req.params.query.toLowerCase();
    
    const results = snippets.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.content.toLowerCase().includes(query) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(query)))
    );
    
    res.json({ 
      success: true, 
      snippets: results,
      count: results.length 
    });
  } catch (err) {
    console.error('Error searching snippets:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search snippets' 
    });
  }
});

// Get snippets by category (must be before /:id route)
router.get('/category/:category', (req, res) => {
  try {
    const db = getDb();
    const snippets = db.snippets || [];
    const category = req.params.category;
    
    const results = snippets.filter(s => s.category === category);
    
    res.json({ 
      success: true, 
      snippets: results,
      count: results.length 
    });
  } catch (err) {
    console.error('Error fetching snippets by category:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch snippets' 
    });
  }
});

// Get a single snippet
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const snippets = db.snippets || [];
    const snippet = snippets.find(s => s.id === req.params.id);
    
    if (!snippet) {
      return res.status(404).json({ 
        success: false, 
        error: 'Snippet not found' 
      });
    }
    
    res.json({ success: true, snippet });
  } catch (err) {
    console.error('Error fetching snippet:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch snippet' 
    });
  }
});

// Create a new snippet
router.post('/', (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and content are required' 
      });
    }
    
    const db = getDb();
    if (!db.snippets) db.snippets = [];
    
    const newSnippet = {
      id: genId(),
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.snippets.push(newSnippet);
    updateDb();
    
    res.status(201).json({ 
      success: true, 
      snippet: newSnippet 
    });
  } catch (err) {
    console.error('Error creating snippet:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create snippet' 
    });
  }
});

// Update a snippet
router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    if (!db.snippets) db.snippets = [];
    
    const snippetIndex = db.snippets.findIndex(s => s.id === req.params.id);
    
    if (snippetIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Snippet not found' 
      });
    }
    
    const updates = req.body;
    const snippet = db.snippets[snippetIndex];
    
    // Apply updates
    if (updates.title !== undefined) snippet.title = updates.title.trim();
    if (updates.content !== undefined) snippet.content = updates.content.trim();
    if (updates.category !== undefined) snippet.category = updates.category;
    if (updates.tags !== undefined) snippet.tags = Array.isArray(updates.tags) ? updates.tags : [updates.tags].filter(Boolean);
    if (updates.usageCount !== undefined) snippet.usageCount = updates.usageCount;
    
    snippet.updatedAt = new Date().toISOString();
    updateDb();
    
    res.json({ 
      success: true, 
      snippet 
    });
  } catch (err) {
    console.error('Error updating snippet:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update snippet' 
    });
  }
});

// Delete a snippet
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    if (!db.snippets) db.snippets = [];
    
    const snippetIndex = db.snippets.findIndex(s => s.id === req.params.id);
    
    if (snippetIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Snippet not found' 
      });
    }
    
    db.snippets.splice(snippetIndex, 1);
    updateDb();
    
    res.json({ 
      success: true, 
      message: 'Snippet deleted' 
    });
  } catch (err) {
    console.error('Error deleting snippet:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete snippet' 
    });
  }
});

export { router as snippetsRouter };
