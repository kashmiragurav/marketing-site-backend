const express        = require("express");
const router         = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const cartController = require("../controllers/cartController");

// All cart routes require login
router.use(authMiddleware);

router.get("/",             cartController.getCart);
router.post("/",            cartController.addToCart);
router.post("/revalidate",  cartController.revalidateCart);
router.put("/:productId",   cartController.updateCartItem);
router.delete("/:productId",cartController.deleteCartItem);
router.delete("/",          cartController.clearCart);

module.exports = router;
