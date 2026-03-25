const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { canModifyCart } = require("../middleware/roleMiddleware");
const cartController = require("../controllers/cartController");

router.use(authMiddleware);

router.post("/", cartController.addToCart);
router.get("/", cartController.getCart);
router.put("/:productId", canModifyCart, cartController.updateCartItem);
router.delete("/:productId", canModifyCart, cartController.deleteCartItem);
router.delete("/", canModifyCart, cartController.clearCart);


module.exports = router;