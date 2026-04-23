# 🏗️ Arquitetura SSM - Saúde na Mão

## 📐 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Pages:                                                           │
│  ├─ CheckoutIA (5 steps + IA verification)                      │
│  ├─ ReceitaDigital (QR Code + PDF)                             │
│  ├─ PharmacistDashboard (validations + alerts)                 │
│  ├─ PharmacyDashboard (B2B metrics)                            │
│  ├─ AnalyticsDashboard (charts + insights)                    │
│  └─ SecurityAuditDashboard (logs + filters)                   │
│                                                                   │
│  Components:                                                      │
│  ├─ DrugInteractionAlert                                        │
│  ├─ PharmacistStatus (real-time polling)                       │
│  └─ Various UI components (Navbar, Footer, etc)               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (HTTP/REST)
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Routes:                                                      │
│  ├─ /auth (login, register, refresh token)                     │
│  ├─ /prescriptions (upload, get, validate)                     │
│  │  └─ /:id/receita (receita digital + QR)                    │
│  ├─ /pharmacies (list, get, nearby)                            │
│  │  └─ /:id/analytics (vendas, métricas, insights)           │
│  ├─ /pharmacists (get, dashboard)                              │
│  │  └─ /validations (pending, approve, reject)                │
│  ├─ /orders (create, get, list)                                │
│  ├─ /audit (logs, filter, search)                              │
│  └─ /drugs (list, interactions, contraindications)            │
│                                                                   │
│  Controllers:                                                     │
│  ├─ authController                                              │
│  ├─ prescriptionController                                      │
│  │  └─ getReceitaDigital()                                    │
│  ├─ pharmacyController                                          │
│  ├─ analyticsController                                         │
│  ├─ pharmacistController                                        │
│  └─ orderController                                             │
│                                                                   │
│  Services (Business Logic):                                      │
│  ├─ prescriptionService                                         │
│  │  └─ getReceitaDigital(prescriptionId, userId)             │
│  ├─ drugInteractionService ⭐ (Core IA)                        │
│  │  ├─ verificarInteracoes(medicamentos)                      │
│  │  └─ calcularRiscoCompra(dados)                            │
│  ├─ analyticsService ⭐                                         │
│  │  ├─ getAnalyticsByPeriod(farmaciaId, periodo)            │
│  │  ├─ getVendasPorPeriodo()                                  │
│  │  ├─ getTopMedicamentos()                                   │
│  │  ├─ getPerformanceHorario()                                │
│  │  ├─ generateInsights()                                     │
│  │  └─ generateRecomendacoes()                                │
│  ├─ blockchainAuditService ⭐ (Security)                       │
│  │  ├─ auditarAcao(tipo, usuarioId, recurso, dados)         │
│  │  ├─ minePendingTransactions()                              │
│  │  ├─ verificarIntegridade(recurso)                          │
│  │  └─ obterHistoricoAuditoria(recurso)                      │
│  ├─ lgpdEncryptionService ⭐ (Security)                        │
│  │  ├─ encriptarDados(dados)                                  │
│  │  ├─ descriptarDados(encrypted, iv, authTag)              │
│  │  ├─ gerarAssinaturaPKI(dados, chavePrivada)              │
│  │  ├─ gerarHashCriptografico(dados)                         │
│  │  └─ anonimizar(dados)                                      │
│  ├─ paymentService                                              │
│  ├─ emailService                                                │
│  └─ notificationService                                         │
│                                                                   │
│  Middlewares:                                                     │
│  ├─ authMiddleware (JWT verification)                          │
│  ├─ auditMiddleware (log actions)                              │
│  ├─ errorHandler                                                │
│  └─ validationMiddleware                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (Mongoose ODM)
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (MongoDB Atlas)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collections:                                                     │
│  ├─ users (clientes, farmacêuticos, admins)                    │
│  ├─ pharmacies (farmácias)                                      │
│  ├─ pharmacists (farmacêuticos com status)                     │
│  ├─ prescriptions (receitas enviadas)                          │
│  ├─ receitas_digitais ⭐ (digital receipts + QR)              │
│  ├─ orders (pedidos com medicamentos)                          │
│  ├─ drugs (15 medicamentos reais com ANVISA)                  │
│  ├─ drug_interactions (590+ interações)                        │
│  ├─ drug_contraindications (80+ contraindicações)            │
│  ├─ audit_logs ⭐ (ações registradas)                          │
│  ├─ products                                                     │
│  ├─ payments                                                     │
│  └─ support_messages                                             │
│                                                                   │
│  Indexes:                                                         │
│  ├─ users: email, cpf (unique)                                 │
│  ├─ pharmacists: crm (unique), logado, farmacia_id            │
│  ├─ orders: user_id, farmacia_id, createdAt                  │
│  ├─ drugs: nome, principio_ativo                               │
│  └─ audit_logs: usuario_id, recurso, criado_em               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Segurança

```
┌─────────────────┐
│  Cliente Login  │
└────────┬────────┘
         │
         ↓
┌────────────────────────────────┐
│  JWT Token Generation          │
│  - 24h expiration              │
│  - Refresh token support       │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Request to Protected Route    │
│  + Authorization header        │
└────────────┬───────────────────┘
             │
             ↓
    ┌────────────────────┐
    │ JWT Verification   │
    └────────┬───────────┘
             │
    ┌────────┴───────────────┐
    │                        │
    ↓ (Valid)               ↓ (Invalid)
┌────────────────┐    ┌─────────────────┐
│ Authorize Role │    │ Reject - 401    │
└────────┬───────┘    └─────────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ↓ (Approved)         ↓ (Denied)
┌──────────────┐   ┌──────────────┐
│ Execute      │   │ Deny - 403   │
│ Business     │   └──────────────┘
│ Logic        │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────┐
│ Audit Logging                    │
│ - User ID                        │
│ - IP Address                     │
│ - User Agent                     │
│ - Action                         │
│ - Resource                       │
│ - Old/New Values                 │
└──────────┬───────────────────────┘
           │
           ↓
┌──────────────────────────────────┐
│ Blockchain Mining (async)        │
│ - PoW with difficulty=4          │
│ - SHA-256 hash                   │
│ - Immutable chain                │
└──────────────────────────────────┘

```

---

## 🔄 Fluxo de Checkout com IA

```
┌──────────────────┐
│  Start Checkout  │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────┐
│ Step 1: Review Cart Items    │
│ - Display products           │
│ - Show quantities            │
│ - Calculate subtotal         │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Step 2: Drug Verification ⭐ │
│                              │
│ IA Service:                  │
│ 1. verificarInteracoes()    │
│    - Check all drug pairs   │
│    - Find interactions      │
│ 2. calcularRiscoCompra()    │
│    - Fraud scoring          │
│    - Risk assessment        │
└────────┬─────────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ↓ (Safe)          ↓ (Risk)
  Continue         Display
                   Alert
                   ├─ Severity
                   ├─ Effects
                   ├─ Alternatives
                   └─ Approve/Cancel
         │
         ↓
┌──────────────────────────────┐
│ Step 3: Select Pharmacy      │
│ - Nearby pharmacies          │
│ - Pharmacist status          │
│   (online/offline)           │
│ - Check inventory            │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Step 4: Delivery Address     │
│ - Enter/select address       │
│ - Calculate shipping         │
│ - Verify CEP                 │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Step 5: Payment              │
│ - Select payment method      │
│ - Process transaction        │
│ - Store receipt              │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Step 6: Confirmation         │
│ - Order ID                   │
│ - Expected delivery          │
│ - Tracking link              │
│ - Digital receipt QR         │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│ Create Digital Receipt ⭐    │
│ - Generate QR Code           │
│ - Sign with PKI              │
│ - Hash with SHA-256          │
│ - Store in DB                │
└──────────────────────────────┘
```

---

## 📊 IA & Fraud Detection Flow

```
┌─────────────────────────────┐
│   Drug Interaction IA       │
└──────────┬──────────────────┘
           │
           ├─ Medicamento 1
           ├─ Medicamento 2
           └─ Medicamento N
           │
           ↓
┌──────────────────────────────┐
│ Query DrugInteraction DB     │
│ bidirectional (med1→2, 2→1)  │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Check Contraindications      │
│ - Age                        │
│ - Pregnancy                  │
│ - Disease                    │
│ - Allergies                  │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Calculate Severity           │
│ - SEGURO (0-25)              │
│ - CUIDADO (26-50)            │
│ - PERIGO (51-75)             │
│ - BLOQUEADO (76-100)         │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Fraud Risk Scoring           │
│ Factors:                     │
│ - Order amount               │
│ - User history               │
│ - Pharmacist status          │
│ - Time of day                │
│ - Geographic anomaly         │
│ - Interaction severity       │
│ - High-risk drug             │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Final Risk Score (0-100)     │
│ - < 30: Low (Auto approve)   │
│ - 30-70: Medium (Validate)   │
│ - > 70: High (Block/Review)  │
└──────────────────────────────┘
```

---

## 📈 Analytics Pipeline

```
┌─────────────────────────────┐
│  Request Analytics          │
│  - Pharmacy ID              │
│  - Period (dia/sem/mes/ano) │
└──────────┬──────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 1. getVendasPorPeriodo       │
│    Aggregate sales by date   │
│    Output: [{data, vendas,   │
│    receita}, ...]            │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 2. getTopMedicamentos        │
│    Sort by quantity          │
│    Output: Top 10 products   │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 3. getDistribuicaoCategoria  │
│    Group by category         │
│    Output: Pie chart data    │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 4. getPerformanceHorario     │
│    Sales by hour (0-23)      │
│    Output: Bar chart data    │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 5. getPadraoFraude           │
│    Risk score trend          │
│    Output: Line chart data   │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 6. generateInsights          │
│    ML analysis:              │
│    - High volume?            │
│    - High fraud?             │
│    - Excellent conversion?   │
│    Output: [{titulo,         │
│    descricao, tipo,          │
│    confianca}]               │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ 7. generateRecomendacoes     │
│    Actionable suggestions    │
│    Output: [recomendacoes]   │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Return Combined Analytics    │
│ JSON response to frontend    │
└──────────────────────────────┘
```

---

## 🔐 Blockchain Audit Chain

```
┌──────────────────┐
│  Genesis Block   │ (index=0, nonce=0, hash=...)
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Action Logged: PRESCRIPTION_SENT  │
│ - Type: Create                   │
│ - User: cliente_123              │
│ - Resource: Prescription         │
│ - Timestamp: 1234567890          │
└────────┬─────────────────────────┘
         │ (Add to pending)
         ↓
┌──────────────────────────────────┐
│ Action Logged: PRESCRIPTION_VALIDATED
│ - Type: Approve                  │
│ - User: farmaceut_456            │
│ - Resource: Prescription         │
│ - Timestamp: 1234567900          │
└────────┬─────────────────────────┘
         │ (Add to pending)
         ↓
┌──────────────────────────────────┐
│ Pending Transactions = 2          │
│ (Auto-mine when >= 5 or manual)   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Mine Block #1                    │
│ - Previous Hash: ...             │
│ - Nonce: 0                       │
│ - Transactions: [action1,        │
│                  action2]        │
│ - Difficulty: 4 (####...)        │
│                                  │
│ PoW: Find nonce where            │
│ hash.startsWith("0000")          │
│                                  │
│ Result: nonce=42, hash=...       │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Block #1 Added to Chain          │
│ - Immutable                      │
│ - Verified                       │
│ - Added to history               │
└──────────────────────────────────┘

┌─────────────────────────────────────┐
│ Verify Chain Integrity              │
│ 1. Check all block hashes           │
│ 2. Verify PoW for each block        │
│ 3. Verify previous hash reference   │
│ Result: ✅ Valid / ❌ Compromised   │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Schema Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  nome: String,
  email: String (unique, indexed),
  cpf: String (unique, indexed),
  senha_hash: String,
  tipo: String (enum: cliente|farmacia|farmaceutico|administrador),
  farmacia_id: ObjectId (ref: Pharmacy),
  telefone: String,
  dataNascimento: Date,
  endereco: { rua, numero, cep, cidade, estado },
  lgpd_consentimento: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Pharmacists Collection
```javascript
{
  _id: ObjectId,
  usuario_id: ObjectId (ref: User, unique),
  crm: String (unique, indexed),
  farmacia_id: ObjectId (ref: Pharmacy),
  logado: Boolean,
  paused: Boolean,
  receitas_validadas: Number,
  receitas_rejeitadas: Number,
  tempo_resposta_medio: Number,
  status_desde: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  cliente_id: ObjectId (ref: User, indexed),
  farmacia_id: ObjectId (ref: Pharmacy, indexed),
  medicamentos: [{ 
    produto_id, nome, dosagem, 
    quantidade, preco, risco 
  }],
  total: Number,
  status_pagamento: String (enum: pendente|pago|falhou),
  status_validacao: String (enum: pendente|aprovado|rejeitado),
  farmaceutico_validou: ObjectId (ref: Pharmacist),
  validado_em: Date,
  risco_compra: Number (0-100),
  endereco_entrega: Object,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### ReceitaDigital Collection
```javascript
{
  _id: ObjectId,
  prescriptionId: ObjectId (ref: Prescription, unique),
  paciente: {
    id: ObjectId,
    nome: String,
    cpf: String,
    dataNascimento: Date
  },
  farmaceutico: {
    id: ObjectId,
    nome: String,
    crm: String,
    farmacia: String
  },
  medicamentos: [{
    nome, dosagem, quantidade, orientacao, risco
  }],
  assinatura: String (PKI signature),
  hash: String (SHA-256, unique, indexed),
  dataAssinatura: Date,
  valido: Boolean,
  verificacoes: [{
    verificadoEm: Date,
    verificadoPor: ObjectId,
    resultado: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog Collection
```javascript
{
  _id: ObjectId,
  usuario_id: ObjectId (ref: User, indexed),
  usuario_email: String,
  acao: String (indexed),
  recurso: String,
  recurso_id: String,
  valores_anteriores: Mixed,
  valores_novos: Mixed,
  ip_origem: String,
  user_agent: String,
  status: String (enum: sucesso|falha|tentativa),
  motivo_falha: String,
  criado_em: Date (indexed, TTL: 2555 days)
}
```

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] JWT secret set
- [ ] Encryption key set
- [ ] CORS origins whitelisted
- [ ] SSL/TLS enabled
- [ ] MongoDB backups scheduled
- [ ] Logs aggregation configured
- [ ] Error tracking (Sentry) set up
- [ ] Performance monitoring (New Relic) set up
- [ ] DDoS protection enabled
- [ ] Rate limiting active
- [ ] Cache strategy implemented

---

**Última Atualização**: 2026-04-23  
**Versão**: 1.0.0  
**Status**: Production-Ready ✅
