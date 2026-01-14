const PROXY_CONFIG = {
  "/api": {
    target: "http://localhost:5000",
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:5000${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${err.code || err.message}`);
      console.error("Cannot connect to backend API at http://localhost:5000");
      console.error("Please ensure the backend is running using: ./run-backend.sh");
      res.writeHead(500, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify({
        error: "Cannot connect to backend",
        message: "Please ensure the backend API is running on http://localhost:5000",
        details: err.message
      }));
    }
  }
};

module.exports = PROXY_CONFIG;
