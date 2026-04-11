const express = require("express");
const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/pharmacy/:pharmacyId/stats",
  protect,
  authorize("farmacia", "administrador"),
  orderController.getOrderStats,
);

router.get(
  "/pharmacy/:pharmacyId",
  protect,
  authorize("farmacia", "administrador"),
  orderController.getPharmacyOrders,
);

router.get("/", protect, orderController.getUserOrders);
router.get("/:id", protect, orderController.getOrderById);
router.post("/:id/cancel", protect, orderController.cancelOrder);
router.post("/:id/rate", protect, orderController.rateDelivery);

router.patch(
  "/:id/status",
  protect,
  authorize("farmacia", "administrador"),
  orderController.updateOrderStatus,
);

router.post(
  "/:id/reject",
  protect,
  authorize("farmacia", "administrador"),
  orderController.rejectOrder,
);

router.patch(
  "/:id/location",
  protect,
  authorize("farmacia", "administrador"),
  orderController.updateDeliveryLocation,
);

router.post(
  "/:id/pickup-code",
  protect,
  authorize("farmacia", "administrador"),
  orderController.generatePickupCode,
);

module.exports = router;
