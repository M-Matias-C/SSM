require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const Review = require("../models/Review");
const Pharmacy = require("../models/Pharmacy");

const nomes = [
  "Ana Silva", "Carlos Santos", "Maria Oliveira", "João Souza", "Fernanda Costa",
  "Pedro Almeida", "Juliana Lima", "Rafael Pereira", "Camila Rodrigues", "Lucas Ferreira",
  "Beatriz Gomes", "Thiago Martins", "Larissa Ribeiro", "Mateus Carvalho", "Amanda Nascimento",
  "Gabriel Araújo", "Patrícia Barbosa", "Bruno Mendes", "Isabela Rocha", "Vinícius Moreira",
  "Letícia Cardoso", "Diego Correia", "Mariana Teixeira", "Gustavo Dias", "Aline Monteiro",
  "Felipe Cavalcanti", "Natália Pinto", "Ricardo Nunes", "Priscila Vieira", "André Campos",
  "Daniela Ramos", "Rodrigo Azevedo", "Tatiana Freitas", "Marcelo Machado", "Bruna Castro",
  "Eduardo Melo", "Carolina Duarte", "Henrique Lopes", "Vanessa Cunha", "Roberto Moura",
  "Simone Borges", "Renato Fonseca", "Érica Sousa", "Alexandre Batista", "Jéssica Pires",
  "Paulo Miranda", "Cláudia Sampaio", "Leonardo Guimarães", "Monique Siqueira", "Fábio Rezende",
];

const comentariosBons5 = [
  "Excelente atendimento! Sempre volto aqui.",
  "Melhor farmácia da região, super organizada.",
  "Preços ótimos e atendentes muito educados.",
  "Recomendo demais! Entrega rápida e produtos de qualidade.",
  "Farmácia impecável, nota 10!",
  "Atendimento maravilhoso, equipe muito atenciosa.",
  "Sempre encontro tudo que preciso aqui.",
  "Ótima experiência, entrega super rápida!",
];

const comentariosBons4 = [
  "Boa farmácia, preços justos.",
  "Gostei bastante, bom atendimento.",
  "Bem localizada e organizada.",
  "Atendimento bom, podia ter mais variedade.",
  "Farmácia confiável, recomendo.",
  "Bom custo-benefício nos medicamentos.",
];

const comentariosNeutros3 = [
  "Razoável, nada de mais.",
  "Atendimento ok, mas poderia melhorar.",
  "Preços na média, nada especial.",
  "Demora um pouco no atendimento.",
  "Farmácia mediana, cumpre o básico.",
];

const comentariosRuins2 = [
  "Atendimento demorado, fiquei esperando muito.",
  "Faltam muitos medicamentos no estoque.",
  "Atendente foi grosseiro, não gostei.",
  "Preços acima da média sem motivo.",
];

const comentariosRuins1 = [
  "Péssimo atendimento, nunca mais volto.",
  "Medicamento vencido na prateleira, absurdo!",
  "Pior experiência que já tive em farmácia.",
];

function getComentarioParaNota(nota) {
  switch (nota) {
    case 5: return comentariosBons5[Math.floor(Math.random() * comentariosBons5.length)];
    case 4: return comentariosBons4[Math.floor(Math.random() * comentariosBons4.length)];
    case 3: return comentariosNeutros3[Math.floor(Math.random() * comentariosNeutros3.length)];
    case 2: return comentariosRuins2[Math.floor(Math.random() * comentariosRuins2.length)];
    case 1: return comentariosRuins1[Math.floor(Math.random() * comentariosRuins1.length)];
    default: return null;
  }
}

function gerarNotaComPeso(avaliacaoFarmacia) {
  const rand = Math.random();
  if (avaliacaoFarmacia >= 4.5) {
    if (rand < 0.50) return 5;
    if (rand < 0.80) return 4;
    if (rand < 0.92) return 3;
    if (rand < 0.97) return 2;
    return 1;
  } else if (avaliacaoFarmacia >= 4.0) {
    if (rand < 0.30) return 5;
    if (rand < 0.65) return 4;
    if (rand < 0.85) return 3;
    if (rand < 0.95) return 2;
    return 1;
  } else {
    if (rand < 0.15) return 5;
    if (rand < 0.40) return 4;
    if (rand < 0.70) return 3;
    if (rand < 0.88) return 2;
    return 1;
  }
}

function gerarDataRecente() {
  const agora = Date.now();
  const seisMessesAtras = agora - 180 * 24 * 60 * 60 * 1000;
  return new Date(seisMessesAtras + Math.random() * (agora - seisMessesAtras));
}

async function seedReviews() {
  try {
    await connectDB();
    console.log("Limpando avaliações existentes...");
    await Review.deleteMany({});

    const farmacias = await Pharmacy.find({ ativa: true });
    if (farmacias.length === 0) {
      console.log("Nenhuma farmácia encontrada. Rode o seed principal primeiro.");
      return;
    }

    let totalCriadas = 0;

    for (const farmacia of farmacias) {
      const qtdAvaliacoes = Math.floor(Math.random() * 25) + 15;
      const nomesUsados = [...nomes].sort(() => Math.random() - 0.5).slice(0, qtdAvaliacoes);
      const reviews = [];

      for (let i = 0; i < qtdAvaliacoes; i++) {
        const nota = gerarNotaComPeso(farmacia.avaliacao);
        const temComentario = Math.random() < 0.10;
        const comentario = temComentario ? getComentarioParaNota(nota) : null;

        reviews.push({
          id_farmacia: farmacia._id,
          id_usuario: new mongoose.Types.ObjectId(),
          nome_usuario: nomesUsados[i],
          nota,
          comentario,
          createdAt: gerarDataRecente(),
        });
      }

      await Review.insertMany(reviews);

      const stats = await Review.aggregate([
        { $match: { id_farmacia: farmacia._id } },
        { $group: { _id: null, avg: { $avg: "$nota" }, count: { $sum: 1 } } },
      ]);

      if (stats.length > 0) {
        farmacia.avaliacao = Math.round(stats[0].avg * 10) / 10;
        farmacia.total_avaliacoes = stats[0].count;
        await farmacia.save();
      }

      const comComentario = reviews.filter(r => r.comentario).length;
      console.log(
        `  ${farmacia.nome}: ${qtdAvaliacoes} avaliações (${comComentario} com comentário), média ${farmacia.avaliacao}`,
      );
      totalCriadas += qtdAvaliacoes;
    }

    console.log(`\nTotal: ${totalCriadas} avaliações criadas para ${farmacias.length} farmácias.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedReviews()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Erro:", err);
      process.exit(1);
    });
}

module.exports = { seedReviews };
