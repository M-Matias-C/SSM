const express = require("express");
const prescriptionController = require("../controllers/prescriptionController");
const authMiddleware = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");
const {
  upload,
  handleMulterError,
} = require("../middlewares/uploadPrescription");

const router = express.Router();

router.post(
  "/upload",
  authMiddleware.protect,
  upload,
  handleMulterError,
  prescriptionController.uploadPrescription,
  audit("PRESCRIPTION_UPLOADED", "Prescription"),
);

router.get(
  "/admin/pending",
  authMiddleware.protect,
  authMiddleware.authorize("farmaceutico", "administrador"),
  prescriptionController.getPendingPrescriptions,
);

router.patch(
  "/admin/:id/validate",
  authMiddleware.protect,
  authMiddleware.authorize("farmaceutico", "administrador"),
  prescriptionController.validatePrescription,
  audit("PRESCRIPTION_VALIDATED", "Prescription"),
);

router.get(
  "/",
  authMiddleware.protect,
  prescriptionController.getUserPrescriptions,
);

router.patch(
  "/fcm-token",
  authMiddleware.protect,
  prescriptionController.updateFcmToken,
);

router.get(
  "/:id",
  authMiddleware.protect,
  prescriptionController.getPrescriptionById,
);

router.delete(
  "/:id/cancel",
  authMiddleware.protect,
  prescriptionController.cancelPrescription,
);

module.exports = router;
