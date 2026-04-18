const express = require("express");
const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");

const router = express.Router();

router.get(
  "/pharmacy/:pharmacyId/stats",
  protect,
  authorize("dono_farmacia", "farmaceutico", "administrador"),
  orderController.getOrderStats,
);

router.get(
  "/pharmacy/:pharmacyId",
  protect,
  authorize("dono_farmacia", "farmaceutico", "administrador"),
  orderController.getPharmacyOrders,
);

router.get("/", protect, orderController.getUserOrders);
router.post("/", protect, orderController.createOrder);
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
  authorize("dono_farmacia", "farmaceutico", "administrador"),
  orderController.updateOrderStatus,
  audit("ORDER_STATUS_UPDATED", "Order"),
);

router.post(
  "/:id/reject",
  protect,
  authorize("dono_farmacia", "administrador"),
  orderController.rejectOrder,
  audit("ORDER_REJECTED", "Order"),
);

router.patch(
  "/:id/location",
  protect,
  authorize("dono_farmacia", "entregador", "administrador"),
  orderController.updateDeliveryLocation,
);

router.post(
  "/:id/pickup-code",
  protect,
  authorize("dono_farmacia", "administrador"),
  orderController.generatePickupCode,
);

router.post(
  "/:id/qr-code",
  protect,
  orderController.generateDeliveryQRCode,
);

router.post(
  "/:id/confirm-qr",
  protect,
  authorize("entregador", "administrador"),
  orderController.confirmDeliveryByQR,
);

module.exports = router;
