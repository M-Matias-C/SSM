# 🚀 SSM - Saúde na Mão: Guia de Testes

## 📋 Checklist de Testes

### 1️⃣ SETUP INICIAL

- [ ] Clonar repositório e instalar dependências
  ```bash
  cd saude-na-mao/backend && npm install
  cd ../frontend && npm install
  ```

- [ ] Configurar variáveis de ambiente
  ```bash
  # backend/.env
  MONGODB_URI=seu_mongodb_url
  JWT_SECRET=sua_chave_secreta
  ENCRYPTION_KEY=sua_chave_encriptacao
  FRONTEND_URL=http://localhost:5173
  ```

- [ ] Iniciar serviços
  ```bash
  # Terminal 1 - Backend
  cd backend && npm run dev
  
  # Terminal 2 - Frontend
  cd frontend && npm run dev
  ```

---

### 2️⃣ TESTES DE INTEGRAÇÃO FRONTEND

#### Teste: Autenticação
- [ ] Acessar `http://localhost:5173/login`
- [ ] Login com credentials válidas
- [ ] Token armazenado no localStorage
- [ ] Redirect para home após login

#### Teste: Checkout IA
- [ ] Navegar para `/checkout-ia`
- [ ] Step 1: Revisar itens do carrinho
- [ ] Step 2: Verificação de interações
  - [ ] Exibição de medicamentos
  - [ ] Alertas de interação (se houver)
  - [ ] Opção de continuar ou cancelar
- [ ] Step 3: Seleção de farmácia
  - [ ] Lista de farmácias próximas
  - [ ] Status do farmacêutico (online/offline)
- [ ] Step 4: Endereço de entrega
- [ ] Step 5: Confirmação de pedido

#### Teste: Receita Digital
- [ ] Após checkout, acessar `/receita-digital/:id`
- [ ] Visualizar receita com dados:
  - [ ] Paciente (nome, CPF, data nasc.)
  - [ ] Farmacêutico (nome, CRM)
  - [ ] Medicamentos (nome, dosagem, quantidade)
  - [ ] QR Code gerado
  - [ ] Assinatura digital
  - [ ] Hash de integridade
- [ ] Baixar em PDF
- [ ] Baixar QR Code
- [ ] Imprimir receita

#### Teste: Dashboard Farmacêutico
- [ ] Login com conta de farmacêutico
- [ ] Acessar `/dashboard/farmaceutico`
- [ ] Visualizar:
  - [ ] Stats (validações pendentes, alertas, receitas hoje)
  - [ ] Lista de prescrições pendentes
  - [ ] Botões Aprovar/Rejeitar
- [ ] Clicar em "Aprovar" em uma prescrição
- [ ] Verificar atualização em tempo real

#### Teste: Dashboard de Farmácia
- [ ] Login com conta de farmácia
- [ ] Acessar `/dashboard/farmacia`
- [ ] Período selector (dia, semana, mês, ano)
- [ ] Cards de métricas:
  - [ ] Total de vendas
  - [ ] Medicamentos vendidos
  - [ ] Adesão de farmacêuticos
  - [ ] Taxa de conversão
- [ ] Tabela de top 10 medicamentos
- [ ] Gráfico de vendas
- [ ] Alertas de risco

#### Teste: Dashboard Analytics
- [ ] Acessar `/dashboard/analytics`
- [ ] Visualizar gráficos:
  - [ ] LineChart: Vendas ao longo do tempo
  - [ ] BarChart: Top 10 medicamentos
  - [ ] PieChart: Distribuição por categoria
  - [ ] Performance por horário
  - [ ] Padrão de fraude (score)
- [ ] Filtrar por período (dia, semana, mês, ano)
- [ ] Visualizar insights inteligentes
- [ ] Verificar recomendações

#### Teste: Dashboard de Segurança
- [ ] Acessar `/dashboard/seguranca`
- [ ] Filtrar logs (all, crítico, warning, info)
- [ ] Visualizar detalhes de um log
- [ ] Comparar valores anteriores e novos
- [ ] Verificar IP e User Agent
- [ ] Validar status (sucesso/falha)

---

### 3️⃣ TESTES DE API (Backend)

#### Teste: Prescription Digital
```bash
# Obter receita digital
GET /api/v1/prescriptions/:id/receita
Headers: Authorization: Bearer {token}

# Resposta esperada:
{
  "success": true,
  "data": {
    "id": "...",
    "data": "2026-04-23T...",
    "paciente": { "nome", "cpf", "dataNascimento" },
    "farmaceutico": { "nome", "crm", "farmacia" },
    "medicamentos": [...],
    "assinatura": "...",
    "hash": "..."
  }
}
```

#### Teste: Analytics
```bash
# Obter analytics
GET /api/v1/pharmacies/{id}/analytics?period=mes
Headers: Authorization: Bearer {token}

# Resposta esperada:
{
  "success": true,
  "data": {
    "vendaFormatted": [...],
    "topMedicamentos": [...],
    "distribuicaoCategoria": [...],
    "performanceHorario": [...],
    "padraoFraude": [...],
    "insights": [...],
    "recomendacoes": [...]
  }
}
```

#### Teste: Auditoria
```bash
# Listar logs
GET /api/v1/audit?filter=all&limit=50&page=1
Headers: Authorization: Bearer {token}

# Resposta esperada:
{
  "success": true,
  "logs": [{
    "_id": "...",
    "acao": "PRESCRIPTION_VALIDATED",
    "recurso": "Prescription",
    "usuario_email": "...",
    "ip_origem": "...",
    "status": "sucesso",
    "criado_em": "..."
  }],
  "total": 42,
  "page": 1,
  "totalPages": 1
}
```

---

### 4️⃣ TESTES DE SEGURANÇA

#### Teste: Encriptação LGPD
```javascript
// No backend, verificar:
const lgpdService = require('./services/lgpdEncryptionService');

// Encriptar dados
const encrypted = lgpdService.encriptarDados({ email: 'user@example.com' });
console.log(encrypted); // { encrypted, iv, authTag }

// Descriptrar
const decrypted = lgpdService.descriptarDados(
  encrypted.encrypted,
  encrypted.iv,
  encrypted.authTag
);
console.log(decrypted); // { email: 'user@example.com' }

// Anonimizar
const anonimizado = lgpdService.anonimizar('joao@email.com');
console.log(anonimizado); // j****o@email.com

// Mascara CPF
const cpfMask = lgpdService.mascararCPF('12345678900');
console.log(cpfMask); // 123.***.**00
```

#### Teste: Assinatura Digital
```javascript
// Gerar keypair (uma vez):
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// Assinar dados
const assinatura = lgpdService.gerarAssinaturaPKI(
  { nome: 'Dr. Silva', crm: '123456' },
  privateKey
);

// Verificar assinatura
const valido = lgpdService.verificarAssinaturaPKI(
  { nome: 'Dr. Silva', crm: '123456' },
  assinatura,
  publicKey
);
console.log(valido); // true
```

#### Teste: Blockchain de Auditoria
```javascript
// Auditar uma ação
const blockchainService = require('./services/blockchainAuditService');

const resultado = blockchainService.auditarAcao(
  'PRESCRIPTION_APPROVED',
  'user_id_123',
  'Prescription',
  {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    prescription_id: 'rx_123',
    decision: 'approved',
  }
);

// Verificar integridade
const integridade = blockchainService.verificarIntegridade('Prescription');
console.log(integridade); // { valido: true, registros: 15, ultimoRegistro: {...} }

// Ver histórico
const historico = blockchainService.obterHistoricoAuditoria('Prescription');
console.log(historico); // [{ ...transaction, bloco, blockHash }, ...]
```

---

### 5️⃣ TESTES DE PERFORMANCE

#### Teste: Carga de Dashboard
- [ ] Abrir DevTools (F12)
- [ ] Aba Network
- [ ] Acessar `/dashboard/analytics`
- [ ] Verificar:
  - [ ] Tempo total de carregamento < 2s
  - [ ] Requisições API < 500ms
  - [ ] Tamanho das imagens otimizado

#### Teste: Real-time Updates
- [ ] Abrir PharmacistDashboard
- [ ] Simular aprovação em outro cliente
- [ ] Verificar atualização automática (5s)

#### Teste: Paginação
- [ ] Listar 1000+ logs de auditoria
- [ ] Paginar e verificar performance

---

### 6️⃣ TESTES DE COMPATIBILIDADE

#### Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### Devices
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

#### Teste QR Code
- [ ] Gerar QR Code em ReceitaDigital
- [ ] Escanear com:
  - [ ] Camera do iPhone
  - [ ] App WhatsApp Web
  - [ ] App de QR Code

---

### 7️⃣ TESTES DE ERRO

#### Teste: Erro de Acesso
- [ ] Cliente tenta acessar `/dashboard/seguranca` (apenas admin)
- [ ] Deveria redirecionar para home ou mostrar erro 403

#### Teste: Prescrição Não Encontrada
```bash
GET /api/v1/prescriptions/invalid_id/receita
# Esperado: 404 - Prescrição não encontrada
```

#### Teste: Token Expirado
- [ ] Aguardar token expirar (padrão 24h)
- [ ] Tentar fazer requisição
- [ ] Deveria redirecionar para login

#### Teste: Dados Incompletos
- [ ] Tentar submeter checkout sem endereço
- [ ] Deveria mostrar validação de erro

---

## 🎯 Resultados Esperados

### ✅ Sucesso
- Todas as rotas acessíveis
- Gráficos renderizam corretamente
- QR Codes são gerados e legíveis
- Logs aparecem em tempo real
- Dados encriptados nos logs
- Performance < 2s

### ❌ Problemas
- Criar issue no GitHub
- Incluir stack trace
- Screenshots
- Steps para reproduzir

---

## 📊 Métricas para TCC

### Funcionalidades Implementadas
- ✅ IA para Interações Medicamentosas
- ✅ Anti-Fraude com Risk Scoring
- ✅ Farmacêutico Online/Offline
- ✅ Checkout Seguro com 5 Etapas
- ✅ Receita Digital com QR Code
- ✅ Assinatura Digital (PKI)
- ✅ Encriptação LGPD (AES-256-GCM)
- ✅ Blockchain para Auditoria
- ✅ Dashboards B2B com Gráficos
- ✅ Analytics Inteligente com Insights

### Conformidade
- ✅ LGPD: Encriptação, anonimização, consentimento
- ✅ ANVISA: Validação de receitas e CRM
- ✅ PCI DSS: Pagamento seguro (delegado)
- ✅ ISO 27001: Auditoria e blockchain

### Inovação
- 🚀 Blockchain imutável para auditoria
- 🚀 QR Code dinâmico para receitas
- 🚀 Risk scoring com ML (insights automáticos)
- 🚀 Dashboards de negócio em tempo real

---

**Data de Criação**: 2026-04-23  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Testes
