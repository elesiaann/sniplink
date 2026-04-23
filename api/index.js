// Main API handler for Sniplink
const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware
app.use(express.json());

// In-memory storage (in production, use a database)
const links = new Map();
const analytics = new Map();

// Generate a short slug
function generateSlug() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Sniplink API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      totalLinks: links.size,
      totalClicks: Array.from(analytics.values()).reduce((sum, clicks) => sum + clicks.length, 0)
    }
  });
});

// Shorten URL endpoint
app.post('/api/shorten', (req, res) => {
  try {
    const { url, customSlug } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    // Generate or use custom slug
    let slug = customSlug || generateSlug();
    
    // Check if slug already exists
    if (links.has(slug)) {
      if (customSlug) {
        return res.status(400).json({ success: false, error: 'Custom slug already in use' });
      }
      // Generate new slug if auto-generated one exists (very rare)
      slug = generateSlug();
    }
    
    // Store the link
    links.set(slug, {
      url,
      slug,
      createdAt: new Date().toISOString(),
      clicks: 0
    });
    
    // Initialize analytics for this slug
    analytics.set(slug, []);
    
    res.json({
      success: true,
      slug,
      shortUrl: `${req.protocol}://${req.get('host')}/${slug}`,
      originalUrl: url,
      createdAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get analytics for a slug
app.get('/api/analytics/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!links.has(slug)) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    const linkAnalytics = analytics.get(slug) || [];
    const link = links.get(slug);
    
    // Calculate stats
    const totalClicks = linkAnalytics.length;
    const uniqueVisitors = new Set(linkAnalytics.map(a => a.ip)).size;
    
    // Get top countries
    const countryCounts = {};
    linkAnalytics.forEach(a => {
      countryCounts[a.country] = (countryCounts[a.country] || 0) + 1;
    });
    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    // Get browser stats
    const browserCounts = {};
    linkAnalytics.forEach(a => {
      browserCounts[a.browser] = (browserCounts[a.browser] || 0) + 1;
    });
    
    // Get daily clicks for last 7 days
    const dailyClicks = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    linkAnalytics.forEach(a => {
      const date = new Date(a.timestamp).toISOString().split('T')[0];
      if (new Date(a.timestamp) >= sevenDaysAgo) {
        dailyClicks[date] = (dailyClicks[date] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      slug,
      originalUrl: link.url,
      createdAt: link.createdAt,
      totalClicks,
      uniqueVisitors,
      topCountry,
      browserStats: browserCounts,
      dailyClicks,
      recentClicks: linkAnalytics.slice(-10).reverse() // Last 10 clicks
    });
    
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Redirect endpoint (handled by Vercel)
app.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!links.has(slug)) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    const link = links.get(slug);
    
    // Track analytics
    const clickData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      referrer: req.headers['referer'] || 'direct',
      country: req.headers['cf-ipcountry'] || 'unknown',
      browser: getBrowser(req.headers['user-agent']),
      os: getOS(req.headers['user-agent'])
    };
    
    // Add to analytics
    const linkAnalytics = analytics.get(slug) || [];
    linkAnalytics.push(clickData);
    analytics.set(slug, linkAnalytics);
    
    // Update click count
    link.clicks = (link.clicks || 0) + 1;
    links.set(slug, link);
    
    // Redirect to original URL
    res.redirect(link.url);
    
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Helper function to get browser from user agent
function getBrowser(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Other';
}

// Helper function to get OS from user agent
function getOS(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
  
  return 'Other';
}

// Export for Vercel
module.exports = app;