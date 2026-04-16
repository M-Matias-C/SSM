const Pharmacist = require("../models/Pharmacist");
const Pharmacy = require("../models/Pharmacy");
const Logger = require("../utils/logger");

const logger = new Logger("PharmacistController");

exports.listAvailable = async (req, res, next) => {
  try {
    const { id_farmacia, especialidade } = req.query;
    
    const filter = {
      disponivel_chat: true,
      ativo: true,
    };

    if (id_farmacia) {
      filter.id_farmacia = id_farmacia;
    }

    if (especialidade) {
      filter.especialidades = especialidade;
    }

    const pharmacists = await Pharmacist.find(filter)
      .select("nome email telefone crm especialidades foto bio rating tempo_resposta_medio horario_inicio horario_fim")
      .populate("id_farmacia", "nome cidade estado")
      .lean();

    logger.debug("Farmacêuticos disponíveis listados", { count: pharmacists.length });

    res.json({
      success: true,
      data: { pharmacists },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pharmacist = await Pharmacist.findById(id)
      .populate("id_farmacia")
      .lean();

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: "Farmacêutico não encontrado",
      });
    }

    logger.debug("Farmacêutico obtido", { id });

    res.json({
      success: true,
      data: { pharmacist },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      nome,
      email,
      telefone,
      crm,
      id_farmacia,
      especialidades,
      bio,
      dias_atendimento,
    } = req.body;

    const pharmacy = await Pharmacy.findById(id_farmacia);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Farmácia não encontrada",
      });
    }

    const existing = await Pharmacist.findOne({ crm, id_farmacia });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "CRM já cadastrado nesta farmácia",
      });
    }

    const pharmacist = new Pharmacist({
      nome,
      email,
      telefone,
      crm,
      id_farmacia,
      especialidades: especialidades || [],
      bio,
      dias_atendimento: dias_atendimento || ["segunda", "terca", "quarta", "quinta", "sexta"],
    });

    await pharmacist.save();

    logger.info("Farmacêutico criado", { id: pharmacist._id, crm });

    res.status(201).json({
      success: true,
      message: "Farmacêutico cadastrado com sucesso",
      data: { pharmacist },
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      telefone,
      bio,
      especialidades,
      disponivel_chat,
      horario_inicio,
      horario_fim,
      dias_atendimento,
    } = req.body;

    const pharmacist = await Pharmacist.findById(id);
    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: "Farmacêutico não encontrado",
      });
    }

    if (nome) pharmacist.nome = nome;
    if (email) pharmacist.email = email;
    if (telefone) pharmacist.telefone = telefone;
    if (bio) pharmacist.bio = bio;
    if (especialidades) pharmacist.especialidades = especialidades;
    if (disponivel_chat !== undefined) pharmacist.disponivel_chat = disponivel_chat;
    if (horario_inicio) pharmacist.horario_inicio = horario_inicio;
    if (horario_fim) pharmacist.horario_fim = horario_fim;
    if (dias_atendimento) pharmacist.dias_atendimento = dias_atendimento;

    pharmacist.data_atualizacao = new Date();

    await pharmacist.save();

    logger.info("Farmacêutico atualizado", { id });

    res.json({
      success: true,
      message: "Farmacêutico atualizado com sucesso",
      data: { pharmacist },
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pharmacist = await Pharmacist.findByIdAndUpdate(
      id,
      { ativo: false },
      { new: true }
    );

    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: "Farmacêutico não encontrado",
      });
    }

    logger.info("Farmacêutico desativado", { id });

    res.json({
      success: true,
      message: "Farmacêutico desativado com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

exports.getByPharmacy = async (req, res, next) => {
  try {
    const { id_farmacia } = req.params;

    const pharmacists = await Pharmacist.find({
      id_farmacia,
      ativo: true,
    })
      .select("nome email crm especialidades foto rating tempo_resposta_medio")
      .lean();

    logger.debug("Farmacêuticos da farmácia listados", { id_farmacia, count: pharmacists.length });

    res.json({
      success: true,
      data: { pharmacists },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating deve estar entre 1 e 5",
      });
    }

    const pharmacist = await Pharmacist.findById(id);
    if (!pharmacist) {
      return res.status(404).json({
        success: false,
        message: "Farmacêutico não encontrado",
      });
    }

    const novoTotal = pharmacist.total_avaliacoes + 1;
    const novaMedia = 
      (pharmacist.rating * pharmacist.total_avaliacoes + rating) / novoTotal;

    pharmacist.rating = Math.round(novaMedia * 10) / 10;
    pharmacist.total_avaliacoes = novoTotal;

    await pharmacist.save();

    logger.info("Rating atualizado", { id, novoRating: pharmacist.rating });

    res.json({
      success: true,
      message: "Avaliação registrada com sucesso",
      data: { pharmacist },
    });
  } catch (error) {
    next(error);
  }
};
