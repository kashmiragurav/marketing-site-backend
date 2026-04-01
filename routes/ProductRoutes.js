const express = require("express");
const router  = express.Router();

const productController = require("../controllers/ProductController");
const authMiddleware    = require("../middleware/authMiddleware");
const requireRole       = require("../middleware/roleMiddleware");

// ── Public — no auth required ─────────────────────────────────────
router.get("/",       productController.getProducts);
router.get("/search", productController.globalSearch);
router.get("/:id",    productController.getProductById);

// ── Admin + Super Admin — create / bulk ───────────────────────────
router.post("/",     authMiddleware, requireRole("admin", "super_admin"), productController.createProduct);
router.post("/bulk", authMiddleware, requireRole("admin", "super_admin"), productController.bulkCreateProducts);

// ── Admin (own only) + Super Admin — update / delete ─────────────
// Ownership check is enforced inside the controller
router.put("/:id",    authMiddleware, requireRole("admin", "super_admin"), productController.updateProduct);
router.delete("/:id", authMiddleware, requireRole("admin", "super_admin"), productController.deleteProduct);

// ── Super Admin only — restore deleted ───────────────────────────
router.get("/admin/deleted", authMiddleware, requireRole("super_admin"), productController.getDeletedProducts);
router.patch("/:id/restore", authMiddleware, requireRole("super_admin"), productController.restoreProduct);

// ── Any authenticated user ────────────────────────────────────────
router.post("/:id/rate",    authMiddleware, productController.rateProduct);
router.post("/:id/reviews", authMiddleware, productController.addReview);

module.exports = router;
