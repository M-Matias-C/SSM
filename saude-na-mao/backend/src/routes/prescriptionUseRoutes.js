const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { audit } = require('../middlewares/auditMiddleware');
const prescriptionUseService = require('../services/prescriptionUseService');
const Pharmacy = require('../models/Pharmacy');
const PrescriptionUseLog = require('../models/PrescriptionUseLog');

// Obter receitas pendentes para uma farmácia
router.get(
  '/farmacia/:id_farmacia/pendentes',
  authMiddleware.protect,
  authMiddleware.authorize('farmaceutico', 'administrador'),
  async (req, res, next) => {
    try {
      const { id_farmacia } = req.params;

      // Verificar se o farmacêutico trabalha nesta farmácia
      const farmacia = await Pharmacy.findOne({
        _id: id_farmacia,
        farmaceuticos: req.user.id,
      });

      if (!farmacia && req.user.role !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para acessar receitas desta farmácia',
        });
      }

      const receitas = await prescriptionUseService.obterReceitasPendentes(
        id_farmacia
      );

      return res.status(200).json({
        success: true,
        data: receitas,
        total: receitas.length,
        message: 'Receitas pendentes carregadas',
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Aprovar ou rejeitar receita
router.patch(
  '/:id_registro/validar',
  authMiddleware.protect,
  authMiddleware.authorize('farmaceutico', 'administrador'),
  async (req, res, next) => {
    try {
      const { id_registro } = req.params;
      const { decisao, motivo_rejeicao } = req.body;

      if (!['aprovar', 'rejeitar'].includes(decisao)) {
        return res.status(400).json({
          success: false,
          message: 'Decisão inválida. Use "aprovar" ou "rejeitar"',
        });
      }

      const motivo =
        decisao === 'rejeitar'
          ? motivo_rejeicao || 'Receita rejeitada'
          : undefined;

      const registroAtualizado =
        await prescriptionUseService.validarReceita(
          id_registro,
          req.user.id,
          decisao,
          motivo
        );

      const mensagem =
        decisao === 'aprovar'
          ? 'Receita aprovada com sucesso'
          : 'Receita rejeitada';

      return res.status(200).json({
        success: true,
        data: registroAtualizado,
        message: mensagem,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Obter histórico de receitas do usuário
router.get(
  '/usuario/historico',
  authMiddleware.protect,
  async (req, res, next) => {
    try {
      const historico = await prescriptionUseService.obterHistoricoReceitas(
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: historico,
        total: historico.length,
        message: 'Histórico de receitas carregado',
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Obter estatísticas de receitas da farmácia
router.get(
  '/farmacia/:id_farmacia/estatisticas',
  authMiddleware.protect,
  authMiddleware.authorize('farmaceutico', 'dono_farmacia', 'administrador'),
  async (req, res, next) => {
    try {
      const { id_farmacia } = req.params;

      const stats = await prescriptionUseService.obterEstatisticasReceitas(
        id_farmacia
      );

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Estatísticas carregadas',
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Obter detalhes de um registro de uso
router.get(
  '/:id_registro',
  authMiddleware.protect,
  async (req, res, next) => {
    try {
      const { id_registro } = req.params;

      const registro = await PrescriptionUseLog.findById(id_registro)
        .populate('id_receita')
        .populate('id_usuario', 'nome email cpf telefone')
        .populate('id_farmacia', 'nome')
        .populate(
          'medicamentos_solicitados.id_produto',
          'nome dosagem_produto preco_venda'
        );

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado',
        });
      }

      // Verificar permissão
      if (
        registro.id_usuario.toString() !== req.user.id &&
        req.user.role !== 'administrador' &&
        req.user.role !== 'farmaceutico'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este registro',
        });
      }

      return res.status(200).json({
        success: true,
        data: registro,
        message: 'Registro carregado',
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
