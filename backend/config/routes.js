import authRoutes from "../routes/authRoutes.js";
import foodRoutes from "../routes/foodRoutes.js";
import recipeRoutes from "../routes/recipeRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";

const setupRoutes = (app) => {
  // Debug logs for route registration
  console.log("Registering /api/auth routes", typeof authRoutes);
  app.use("/api/auth", authRoutes);
  
  console.log("Registering /api/food routes", typeof foodRoutes);
  app.use("/api/food", foodRoutes);
  
  console.log("Registering /api/recipes routes", typeof recipeRoutes);
  app.use("/api/recipes", recipeRoutes);
  
  console.log("Registering /api/notifications routes", typeof notificationRoutes);
  app.use("/api/notifications", notificationRoutes);

  // Debug endpoint to list all registered routes
  app.get("/api/debug-routes", (req, res) => {
    const routes = app._router.stack
      .filter(r => r.route)
      .map(r => r.route.path);
    res.json({ routes });
  });

  // Test route
  app.get("/api/test", (req, res) => {
    res.json({ message: "Test route working!" });
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });
};

export default setupRoutes; 