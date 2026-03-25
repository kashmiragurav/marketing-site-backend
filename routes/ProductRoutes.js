const express = require("express");
const router = express.Router();

const productController = require("../controllers/ProductController");
const authMiddleware = require("../middleware/authMiddleware");

// Public
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// Protected
router.post('/',     authMiddleware, productController.createProduct)
router.post('/bulk', authMiddleware, productController.bulkCreateProducts)
router.put("/:id", authMiddleware, productController.updateProduct);
router.delete("/:id", authMiddleware, productController.deleteProduct);

// Rating
router.post('/:id/rate', authMiddleware, productController.rateProduct)

module.exports = router;