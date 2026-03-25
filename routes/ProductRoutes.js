const express = require("express");
const router  = express.Router();

const productController = require("../controllers/ProductController");
const authMiddleware    = require("../middleware/authMiddleware");
const requireRole       = require("../middleware/roleMiddleware");

// ── Public ────────────────────────────────────────────────────────
router.get("/",    productController.getProducts);
router.get("/:id", productController.getProductById);

// ── Admin only (auth + role check) ───────────────────────────────
router.post("/",     authMiddleware, requireRole("admin"), productController.createProduct);
router.post("/bulk", authMiddleware, requireRole("admin"), productController.bulkCreateProducts);
router.put("/:id",   authMiddleware, requireRole("admin"), productController.updateProduct);
router.delete("/:id",authMiddleware, requireRole("admin"), productController.deleteProduct);

// ── Authenticated users ───────────────────────────────────────────
router.post("/:id/rate",   authMiddleware, productController.rateProduct);
router.post("/:id/review", authMiddleware, productController.addReview);

module.exports = router;
