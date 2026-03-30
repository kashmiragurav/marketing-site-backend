const express = require("express");
const router  = express.Router();

const productController = require("../controllers/ProductController");
const authMiddleware    = require("../middleware/authMiddleware");
const requireRole       = require("../middleware/roleMiddleware");

// ── Public ────────────────────────────────────────────────────────
router.get("/",           productController.getProducts);
router.get("/search",     productController.globalSearch);
router.get("/:id",        productController.getProductById);

// ── Admin + Vendor (create, update, delete) ───────────────────────
router.post("/",      authMiddleware, requireRole("admin", "vendor"), productController.createProduct);
router.post("/bulk",  authMiddleware, requireRole("admin", "vendor"), productController.bulkCreateProducts);
router.put("/:id",    authMiddleware, requireRole("admin", "vendor"), productController.updateProduct);
router.delete("/:id", authMiddleware, requireRole("admin", "vendor"), productController.deleteProduct);

// ── Admin only ────────────────────────────────────────────────────
router.get("/admin/deleted",  authMiddleware, requireRole("admin"), productController.getDeletedProducts);
router.patch("/:id/restore",  authMiddleware, requireRole("admin"), productController.restoreProduct);

// ── Any authenticated user ────────────────────────────────────────
router.post("/:id/rate",    authMiddleware, productController.rateProduct);
router.post("/:id/reviews", authMiddleware, productController.addReview);

module.exports = router;
