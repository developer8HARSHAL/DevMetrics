import ApiKey from "../models/ApiKey.js";

// Validate API key from request body (for tracking endpoint)
export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.body.apiKey || req.headers["x-api-key"];
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false,
        message: "API key is required" 
      });
    }

    const apiKeyDoc = await ApiKey.findOne({ key: apiKey });
    
    if (!apiKeyDoc) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid API key" 
      });
    }

    if (!apiKeyDoc.isValid()) {
      return res.status(401).json({ 
        success: false,
        message: "API key is inactive or expired" 
      });
    }

    // Attach API key document to request for later use
    req.apiKeyDoc = apiKeyDoc;
    next();
  } catch (err) {
    console.error('API key validation error:', err);
    res.status(500).json({ 
      success: false,
      message: "Authentication failed" 
    });
  }
};

// Validate admin key for API key management endpoints
export const validateAdminKey = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  
  if (!adminKey) {
    return res.status(401).json({ 
      success: false,
      message: "Admin authentication required" 
    });
  }

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ 
      success: false,
      message: "Invalid admin credentials" 
    });
  }

  next();
};

// Optional middleware to validate dashboard access
export const validateDashboardAccess = (req, res, next) => {
  const dashboardKey = req.headers["x-dashboard-key"];
  
  if (!dashboardKey) {
    return res.status(401).json({ 
      success: false,
      message: "Dashboard authentication required" 
    });
  }

  if (dashboardKey !== process.env.DASHBOARD_KEY) {
    return res.status(403).json({ 
      success: false,
      message: "Invalid dashboard credentials" 
    });
  }

  next();
};