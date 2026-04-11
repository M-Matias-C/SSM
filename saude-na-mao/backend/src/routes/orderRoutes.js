const express = require("express");
const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");

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
router.post(
  "/:id/cancel",
  protect,
  orderController.cancelOrder,
  audit("ORDER_CANCELLED", "Order"),
);
router.post("/:id/rate", protect, orderController.rateDelivery);

router.patch(
  "/:id/status",
  protect,
  authorize("farmacia", "administrador"),
  orderController.updateOrderStatus,
  audit("ORDER_STATUS_UPDATED", "Order"),
);

router.post(
  "/:id/reject",
  protect,
  authorize("farmacia", "administrador"),
  orderController.rejectOrder,
  audit("ORDER_REJECTED", "Order"),
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
