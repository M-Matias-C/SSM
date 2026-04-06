require("dotenv").config();
const mongoose = require("mongoose");
const Pharmacy = require("../models/Pharmacy");
const Product = require("../models/Product");

const farmacias = [
  {
    nome: "Farmácia Central",
    cnpj: "12345678000100",
    telefone: "6232221100",
    email: "central@farmaciacentral.com.br",
    logradouro: "Avenida Anhanguera",
    numero: "1500",
    bairro: "Setor Central",
    cidade: "Goiânia",
    estado: "GO",
    cep: "74030010",
    horario_funcionamento: "Seg-Sex 07h-22h, Sab-Dom 08h-20h",
    avaliacao: 4.7,
    total_avaliacoes: 312,
    ativa: true,
    location: { type: "Point", coordinates: [-49.2647, -16.6869] },
  },
  {
    nome: "Farmácia Saúde+",
    cnpj: "23456789000111",
    telefone: "6233441200",
    email: "contato@saudemais.com.br",
    logradouro: "Rua T-37",
    numero: "800",
    bairro: "Setor Bueno",
    cidade: "Goiânia",
    estado: "GO",
    cep: "74215050",
    horario_funcionamento: "Seg-Sex 08h-22h, Sab 08h-18h",
    avaliacao: 4.2,
    total_avaliacoes: 189,
    ativa: true,
    location: { type: "Point", coordinates: [-49.252, -16.7081] },
  },
  {
    nome: "Farmácia Popular",
    cnpj: "34567890000122",
    telefone: "6235561300",
    email: "popular@farmaciaPopular.com.br",
    logradouro: "Rua José Hermano",
    numero: "320",
    bairro: "Jardim Goiás",
    cidade: "Goiânia",
    estado: "GO",
    cep: "74810100",
    horario_funcionamento: "Seg-Sab 07h-21h",
    avaliacao: 3.8,
    total_avaliacoes: 95,
    ativa: true,
    location: { type: "Point", coordinates: [-49.238, -16.72] },
  },
];

function buildProdutos(ids) {
  const [f1, f2, f3] = ids;

  return [
    // Medicamentos comuns
    {
      nome: "Paracetamol 750mg",
      principio_ativo: "Paracetamol",
      categoria: "Analgésico",
      dosagem: "750mg",
      fabricante: "EMS",
      descricao: "Indicado para dores leves a moderadas e febre.",
      preco: 7.9,
      estoque: 85,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f1,
      ativo: true,
    },
    {
      nome: "Ibuprofeno 600mg",
      principio_ativo: "Ibuprofeno",
      categoria: "Anti-inflamatório",
      dosagem: "600mg",
      fabricante: "Medley",
      descricao: "Anti-inflamatório, analgésico e antitérmico.",
      preco: 14.5,
      estoque: 60,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f1,
      ativo: true,
    },
    {
      nome: "Dipirona 500mg",
      principio_ativo: "Metamizol sódico",
      categoria: "Analgésico",
      dosagem: "500mg",
      fabricante: "Sanofi",
      descricao: "Analgésico e antitérmico de uso oral.",
      preco: 9.9,
      estoque: 100,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f2,
      ativo: true,
    },
    {
      nome: "Amoxicilina 500mg",
      principio_ativo: "Amoxicilina",
      categoria: "Antibiótico",
      dosagem: "500mg",
      fabricante: "Teuto",
      descricao: "Antibiótico de amplo espectro.",
      preco: 22.8,
      estoque: 40,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f2,
      ativo: true,
    },
    {
      nome: "Loratadina 10mg",
      principio_ativo: "Loratadina",
      categoria: "Antialérgico",
      dosagem: "10mg",
      fabricante: "Mantecorp",
      descricao: "Anti-histamínico para alergias.",
      preco: 12.4,
      estoque: 70,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f3,
      ativo: true,
    },
    // Vitaminas
    {
      nome: "Vitamina C 1g",
      principio_ativo: "Ácido ascórbico",
      categoria: "Vitamina",
      dosagem: "1g",
      fabricante: "Vitafor",
      descricao: "Suplemento de vitamina C efervescente.",
      preco: 18.9,
      estoque: 55,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f1,
      ativo: true,
    },
    {
      nome: "Vitamina D 2000UI",
      principio_ativo: "Colecalciferol",
      categoria: "Vitamina",
      dosagem: "2000UI",
      fabricante: "Cellgenix",
      descricao: "Suplemento de vitamina D3.",
      preco: 34.9,
      estoque: 30,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f2,
      ativo: true,
    },
    {
      nome: "Complexo B",
      principio_ativo: "Vitaminas do complexo B",
      categoria: "Vitamina",
      dosagem: "1 comprimido",
      fabricante: "Cimed",
      descricao: "Suplemento com vitaminas B1, B2, B3, B5, B6, B7, B9 e B12.",
      preco: 21.5,
      estoque: 45,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f3,
      ativo: true,
    },
    // Controlados
    {
      nome: "Rivotril 2mg",
      principio_ativo: "Clonazepam",
      categoria: "Ansiolítico",
      dosagem: "2mg",
      fabricante: "Roche",
      descricao: "Benzodiazepínico indicado para ansiedade e epilepsia.",
      preco: 28.6,
      estoque: 20,
      receita_obrigatoria: true,
      controlado: true,
      id_farmacia: f1,
      ativo: true,
    },
    {
      nome: "Ritalina 10mg",
      principio_ativo: "Metilfenidato",
      categoria: "Estimulante",
      dosagem: "10mg",
      fabricante: "Novartis",
      descricao: "Indicado para TDAH.",
      preco: 89.9,
      estoque: 10,
      receita_obrigatoria: true,
      controlado: true,
      id_farmacia: f2,
      ativo: true,
    },
    {
      nome: "Alprazolam 0.5mg",
      principio_ativo: "Alprazolam",
      categoria: "Ansiolítico",
      dosagem: "0.5mg",
      fabricante: "Pfizer",
      descricao: "Benzodiazepínico de curta duração para ansiedade.",
      preco: 43.2,
      estoque: 15,
      receita_obrigatoria: true,
      controlado: true,
      id_farmacia: f3,
      ativo: true,
    },
    // Outros
    {
      nome: "Omeprazol 20mg",
      principio_ativo: "Omeprazol",
      categoria: "Antiulceroso",
      dosagem: "20mg",
      fabricante: "EMS",
      descricao: "Inibidor de bomba de prótons para gastrite e úlcera.",
      preco: 16.8,
      estoque: 90,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f1,
      ativo: true,
    },
    {
      nome: "Metformina 850mg",
      principio_ativo: "Cloridrato de metformina",
      categoria: "Antidiabético",
      dosagem: "850mg",
      fabricante: "Merck",
      descricao: "Hipoglicemiante oral para diabetes tipo 2.",
      preco: 11.2,
      estoque: 75,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f2,
      ativo: true,
    },
    {
      nome: "Atenolol 50mg",
      principio_ativo: "Atenolol",
      categoria: "Anti-hipertensivo",
      dosagem: "50mg",
      fabricante: "Astrazeneca",
      descricao: "Betabloqueador para hipertensão e angina.",
      preco: 8.5,
      estoque: 65,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f3,
      ativo: true,
    },
    {
      nome: "Sinvastatina 20mg",
      principio_ativo: "Sinvastatina",
      categoria: "Hipolipemiante",
      dosagem: "20mg",
      fabricante: "Sandoz",
      descricao: "Redutor de colesterol LDL.",
      preco: 13.9,
      estoque: 0,
      receita_obrigatoria: false,
      controlado: false,
      id_farmacia: f1,
      ativo: true,
    },
  ];
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Conectado ao MongoDB");

  await Pharmacy.deleteMany({});
  await Product.deleteMany({});
  console.log("Collections limpas");

  const farmaciasCriadas = await Pharmacy.insertMany(farmacias);
  console.log(`${farmaciasCriadas.length} farmácias criadas`);

  const ids = farmaciasCriadas.map((f) => f._id);
  const produtos = buildProdutos(ids);

  const produtosCriados = await Product.insertMany(produtos);
  console.log(`${produtosCriados.length} produtos criados`);

  await mongoose.disconnect();
  console.log("Seed concluído com sucesso");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Erro no seed:", err.message);
      process.exit(1);
    });
}

module.exports = main;
