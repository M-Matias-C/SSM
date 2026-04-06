const pharmacyService = require("../services/pharmacyService");

async function listPharmacies(req, res, next) {
  try {
    const { page, limit, cidade, estado } = req.query;
    const resultado = await pharmacyService.listPharmacies({
      page,
      limit,
      cidade,
      estado,
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
}

async function getPharmacyById(req, res, next) {
  try {
    const farmacia = await pharmacyService.getPharmacyById(req.params.id);
    res.json({ success: true, data: { farmacia } });
  } catch (error) {
    next(error);
  }
}

async function findNearbyPharmacies(req, res, next) {
  try {
    const { raioKm, limit } = req.query;
    const longitude = parseFloat(req.query.longitude);
    const latitude = parseFloat(req.query.latitude);
    const farmacias = await pharmacyService.findNearbyPharmacies({
      longitude,
      latitude,
      raioKm,
      limit,
    });
    res.json({ success: true, data: { farmacias } });
  } catch (error) {
    next(error);
  }
}

async function getPharmacyProducts(req, res, next) {
  try {
    const { page, limit, categoria, disponivel } = req.query;
    const resultado = await pharmacyService.getPharmacyProducts(req.params.id, {
      page,
      limit,
      categoria,
      disponivel,
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
}

async function createPharmacy(req, res, next) {
  try {
    const farmacia = await pharmacyService.createPharmacy(req.body);
    res.status(201).json({
      success: true,
      message: "Farmácia cadastrada com sucesso",
      data: { farmacia },
    });
  } catch (error) {
    next(error);
  }
}

async function updatePharmacy(req, res, next) {
  try {
    const farmacia = await pharmacyService.updatePharmacy(
      req.params.id,
      req.body,
    );
    res.json({
      success: true,
      message: "Farmácia atualizada com sucesso",
      data: { farmacia },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPharmacies,
  getPharmacyById,
  findNearbyPharmacies,
  getPharmacyProducts,
  createPharmacy,
  updatePharmacy,
};
