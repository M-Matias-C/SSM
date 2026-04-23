# 📋 Sistema de Aprovação de Receitas - Documentação Completa

## 🎯 Visão Geral

O sistema de aprovação de receitas foi implementado para garantir que medicamentos controlados só sejam vendidos mediante aprovação de um farmacêutico. Inclui validação de receitas, anti-fraude e rastreamento completo de todas as transações.

---

## 🔐 Anti-Fraude - Como Funciona

### 1. **Token de Uma Única Uso**
- Cada receita recebe um código único gerado automaticamente (`token_unico`)
- O sistema gera um hash SHA-256 da receita para validação de integridade
- **Tentativa de reusar = Bloqueio automático**

```
Receita: Dipirona (tarja amarela)
Token gerado: a3f5b8c2d9e1f4g6h7i8j9k0l1m2n3o4
Hash: sha256(prescriptionId + userId + pharmacyId + medicines)
→ Após aprovação: Receita marcada como CONSUMIDA
→ Próxima tentativa com mesmo token: REJEITADA com erro "Receita já utilizada"
```

### 2. **Validações Pré-Aprovação**
O farmacêutico vê alertas automáticos:

| Validação | O que faz | Resultado |
|-----------|----------|-----------|
| **Validade** | Verifica se receita expirou | ❌ Bloqueia se expirada |
| **CRM Médico** | Valida se médico existe no sistema | ❌ Bloqueia se inválido |
| **Dupla Utilização** | Verifica se receita já foi aprovada | ❌ Bloqueia automaticamente |
| **Fraude Detectada** | 3+ rejeições em 7 dias | 🚨 Alerta crítico |
| **Atividade Suspeita** | 5+ pedidos em 24h mesma farmácia | 🟡 Alerta médio |

### 3. **Histórico de Rejeições**
```
Cliente Maria tenta 3x com receita falsa em 7 dias:
- Rejeição 1: CRM inválido
- Rejeição 2: Receita expirada
- Rejeição 3: Medicamento não mencionado na receita
→ Status: BLOQUEADO (usuário marcado como suspeito)
→ Sistema: Alerta de "multiplas_rejeicoes" gerado
→ Admin: Pode investigar e desbloquear se necessário
```

---

## 📱 Fluxo do Cliente

### Passo 1: Adicionar ao Carrinho
```
Cliente seleciona medicamentos no app
Carrinho detecta: "dipirona", "cetirizina"
Sistema identifica que "dipirona" é controlada
```

### Passo 2: Prosseguir para Checkout
```
Botão muda de "Finalizar Compra" para "ENVIAR RECEITA"
⚠️ Aviso: "Seu carrinho contém medicamento controlado.
          Será necessário enviar a receita médica."
```

### Passo 3: Upload da Receita - Página Dedicada
```
Cliente clica "Enviar Receita"
→ Redireciona para página /receita (não é modal)
Página mostra:
- Título "Receita Médica"
- Lista de medicamentos controlados do pedido
- Como funciona (3 passos: envie foto, farmácia valida, entregador busca)
- Área de upload grande com preview
- Informações importantes (validade, entregador buscar receita física)
- Link "Voltar ao carrinho" no topo
```

### Passo 4: Upload do Arquivo
```
Cliente clica na área de upload
Seleciona arquivo JPG, PNG ou PDF (até 15MB)
Preview da imagem é mostrado
Remove arquivo clicando em X se precisar
Clica botão "Enviar Receita"
```

### Passo 5: Aguardando Aprovação
```
Sistema mostra status em tempo real:
- Ícone com animação de relógio (⏳)
- Mensagem: "Sua receita foi enviada e está sendo avaliada"
- Página atualiza automaticamente a cada 5 segundos (polling)
- Cliente pode voltar ao carrinho se quiser
```

### Passo 6: Farmacêutico Analia
```
Dashboard do farmacêutico:
→ Nova aba "Receitas Pendentes"
→ Mostra: Paciente, medicamentos, data, CPF
→ Farmacêutico clica para ver detalhes
```

### Passo 7: Resultado da Análise
```
Opção 1 - Aprovada:
  ✓ Status da página muda para "Receita Aprovada!"
  ✓ Botão "Ir para o Checkout" ativa e fica em verde
  ✓ Cliente clica e vai para checkout
  ✓ Pedido é atualizado para status "em_processamento"

Opção 2 - Rejeitada:
  ✗ Status da página muda para "Receita Rejeitada"
  ✗ Mostra motivo da rejeição (ex: "CRM inválido")
  ✗ Botão "Enviar Nova Receita" aparece
  ✗ Cliente pode tentar novamente
  ✗ Pedido é cancelado
```

### Passo 8: Finalizar Compra
```
Após aprovação:
→ Cliente clica "Ir para o Checkout"
→ Vai para página de pagamento
→ Escolhe método de pagamento
→ Confirma pedido
→ Farmácia é notificada para preparar entrega
→ Entregador receberá a receita FÍSICA na entrega
```

---

## 🧑‍⚕️ Fluxo do Farmacêutico

### No Dashboard

**Nova Aba: "Gerenciar Receitas"**

```
┌─────────────────────────────────────┐
│ 📋 Receitas Pendentes               │
│                                     │
│ Total: 5 | Aprovadas: 3             │
│ Rejeitadas: 1 | Pendentes: 1        │
│ Taxa de Aprovação: 75%              │
├─────────────────────────────────────┤
│ PACIENTE  | MEDICAMENTOS | DATA     │
│ Maria S.  | Dipirona(2x) | hoje     │
│ João P.   | Cetirizina   | ontem    │
│ Ana C.    | Amoxicilina  | 2 dias   │
└─────────────────────────────────────┘
```

### Analisar Receita

```
Modal de Aprovação:
┌──────────────────────────────────────┐
│ Validar Receita - Maria Silva        │
├──────────────────────────────────────┤
│ CPF: 123.456.789-00                  │
│                                      │
│ Medicamentos:                        │
│ • Dipirona 500mg - Qtd: 2            │
│ • Ibuprofeno 200mg - Qtd: 1          │
│                                      │
│ Arquivo: [Ver Receita] ⬇️             │
│                                      │
│ Validações Automáticas:              │
│ ✓ Receita válida (10 dias)           │
│ ✓ CRM médico confirmado (Dr. Silva)  │
│ ⚠️ Cliente com 2 rejeições em 3 dias │
│                                      │
│ Motivo de Rejeição (se aplicável):   │
│ [________________]                   │
│                                      │
│ [Cancelar] [Rejeitar] [Aprovar] ✓   │
└──────────────────────────────────────┘
```

### Rejeitando uma Receita

```
Motivos comuns de rejeição:
1. "CRM do médico não encontrado no sistema"
2. "Receita expirada (emissão de 45 dias atrás)"
3. "Medicamento solicitado não está na receita"
4. "Assinatura do médico ilegível"
5. "Paciente tentando usar receita de outra pessoa"

Farmacêutico digita motivo específico
Cliente recebe notificação com motivo
```

---

## 🛡️ Cenários de Fraude Detectados

### Cenário 1: Dupla Utilização
```
Maria tenta comprar:
Compra 1: Dipirona com receita ID=abc123 → APROVADA
Compra 2: Cetirizina com MESMA receita ID=abc123
→ Sistema detecta: token já usado
→ Resultado: ❌ BLOQUEADO AUTOMATICAMENTE
→ Motivo: "Receita já foi utilizada"
```

### Cenário 2: Receita Falsa
```
João tenta 3x em 7 dias com receitas diferentes:
1. CRM "Dr. Silva" = CRM não existe
2. CRM "Dr. Santos" = CRM cancelado há 2 anos
3. CRM "Dr. Costa" = Assinatura diferente das anteriores
→ Sistema detecta padrão
→ Resultado: 🚨 STATUS = "BLOQUEADO" + FraudAlert criado
→ Admin: Investigação necessária
```

### Cenário 3: Atividade Suspeita
```
João faz 5 pedidos com receita em 24 horas:
- 10:00 - Antibiótico
- 10:15 - Antidepressivo
- 11:30 - Controlado C1
- 13:00 - Outro controlado
- 15:45 - Mais outro
→ Sistema gera alerta: "atividade_suspeita"
→ Risco: "MÉDIO"
→ Farmacêutico: Pode revisar com cautela
```

### Cenário 4: Rejeições Contínuas
```
Maria é rejeitada 3 vezes em 7 dias:
- Rejeição 1: Dados incoerentes
- Rejeição 2: Medicamento duplicado
- Rejeição 3: CPF diferente
→ Sistema marca como suspeita
→ Resultado: 🚨 "BLOQUEADO" + Alerta "multiplas_rejeicoes"
→ Limite: 3 rejeições dispara bloqueio automático
```

---

## 📊 Estrutura de Dados

### Modelo: PrescriptionUseLog
```javascript
{
  _id: ObjectId,
  
  // Referências
  id_receita: ObjectId,        // Prescription
  id_pedido: ObjectId,         // Order
  id_usuario: ObjectId,        // User (cliente)
  id_farmacia: ObjectId,       // Pharmacy
  id_farmaceutico: ObjectId,   // User (farmacêutico que analisou)
  
  // Status e Decisão
  status_uso: "pendente_aprovacao" | "aprovado" | "rejeitado" | "cancelado",
  medicamentos_solicitados: [
    { id_produto, nome_produto, quantidade }
  ],
  
  // Segurança
  token_unico: "a3f5b8c2d9e1f4...",  // Hash aleatório único
  hash_receita: "sha256...",           // Para validar integridade
  ip_cliente: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  
  // Decisão
  motivo_rejeicao: "CRM inválido",
  data_aprovacao: Date,
  data_rejeicao: Date,
  
  // Auditoria Detalhada
  historico_validacoes: [
    {
      tipo: "validade_receita" | "crm_medico" | "dupla_utilizacao" | "fraude_detectada" | "aprovado_farmaceutico" | "rejeitado_farmaceutico",
      resultado: String,
      timestamp: Date,
      detalhes: {}
    }
  ],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Modelo: FraudAlert
```javascript
{
  _id: ObjectId,
  id_usuario: ObjectId,
  tipo_alerta: "multiplas_rejeicoes" | "atividade_suspeita" | "receita_falsificada" | "dupla_utilizacao" | "outro",
  descricao: String,
  nivel_risco: "baixo" | "medio" | "alto" | "critico",
  status: "ativo" | "investigando" | "resolvido" | "falso_positivo",
  investigador: ObjectId,
  notas_investigacao: String,
  data_resolucao: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### Listar Receitas Pendentes
```
GET /api/v1/receitas-uso/farmacia/:id_farmacia/pendentes
Authorization: Bearer TOKEN

Response:
{
  success: true,
  data: [PrescriptionUseLog],
  total: 5,
  message: "Receitas pendentes carregadas"
}
```

### Aprovar/Rejeitar Receita
```
PATCH /api/v1/receitas-uso/:id_registro/validar
Authorization: Bearer TOKEN
Content-Type: application/json

Body:
{
  decisao: "aprovar" | "rejeitar",
  motivo_rejeicao: "CRM inválido"  // Obrigatório se rejeitar
}

Response:
{
  success: true,
  data: PrescriptionUseLog,
  message: "Receita aprovada com sucesso"
}
```

### Obter Histórico do Cliente
```
GET /api/v1/receitas-uso/usuario/historico
Authorization: Bearer TOKEN

Response:
{
  success: true,
  data: [PrescriptionUseLog],
  total: 10,
  message: "Histórico de receitas carregado"
}
```

### Estatísticas da Farmácia
```
GET /api/v1/receitas-uso/farmacia/:id_farmacia/estatisticas
Authorization: Bearer TOKEN

Response:
{
  success: true,
  data: {
    total: 100,
    aprovadas: 75,
    rejeitadas: 20,
    pendentes: 5,
    taxa_aprovacao: "75.00"
  },
  message: "Estatísticas carregadas"
}
```

---

## ⚙️ Configuração do Sistema

### Limites Anti-Fraude
```javascript
// backend/src/services/prescriptionUseService.js

REJEICOES_LIMITE = 3              // Máximo de rejeições
DIAS_JANELA_FRAUDE = 7            // Em quantos dias
// Resultado: 3+ rejeições em 7 dias = BLOQUEADO
```

### Tipos de Receita
```javascript
"simples"          // Medicamentos comuns (30 dias)
"especial_c1"      // Controlado C1 (30 dias)
"especial_b"       // Controlado B (30 dias)
"antimicrobiano"   // Antibióticos (10 dias)
```

---

## 🎓 Como Usar (Passo a Passo)

### Para o Cliente

1. **Adicione medicamentos controlados ao carrinho**
   - Exemplo: Dipirona 500mg

2. **Vá ao carrinho**
   - Clique em "Ver Carrinho"

3. **Clique em "Enviar Receita"**
   - Botão aparece quando há medicamentos controlados

4. **Faça upload da receita**
   - Selecione o tipo de receita
   - Escolha a imagem/PDF
   - Clique em "Enviar"

5. **Aguarde aprovação**
   - Farmacêutico analisará em até 24h
   - Você receberá notificação

6. **Se aprovada, finalize a compra**
   - Escolha método de pagamento
   - Conclua o pedido

### Para o Farmacêutico

1. **Acesse o Dashboard**
   - Vá em "Farmacêutico" > "Dashboard"

2. **Clique na aba "Gerenciar Receitas"**
   - Veja receitas pendentes

3. **Clique em uma receita para analisar**
   - Veja dados do paciente
   - Revise medicamentos solicitados
   - Clique em "Ver imagem da receita"

4. **Tome uma decisão**
   - **APROVAR**: Clique botão verde
   - **REJEITAR**: Digite motivo + clique botão vermelho

5. **Sistema atualiza automaticamente**
   - Pedido do cliente é atualizado
   - Cliente recebe notificação

---

## 🚀 Monitoramento e Auditoria

### Dashboard Admin (Futuro)
```
- FraudAlerts: Ver alertas de fraude gerados
- Receitas Rejeitadas: Padrões de rejeição
- Usuários Bloqueados: Quem foi marcado como suspeito
- Taxa de Aprovação por Farmacêutico
- Receitas por Tipo (Simples/C1/B/Antimicrobiano)
```

### Logs de Auditoria
Cada ação é registrada:
```
- Quem enviou a receita (ID do cliente)
- IP e navegador do cliente
- Quando foi enviada (timestamp)
- Qual farmacêutico analisou
- Resultado (aprovado/rejeitado)
- Motivo se rejeitado
- Historico completo de validações
```

---

## ❓ FAQ

**P: Posso reusar a mesma receita?**
R: Não. O sistema marca a receita como CONSUMIDA após aprovação. Tentativa de reusar resultará em bloqueio automático.

**P: Quanto tempo demora para aprovar?**
R: O farmacêutico normalmente aprova em até 2 horas durante horário de funcionamento.

**P: O que acontecer se for rejeitada?**
R: Seu pedido é cancelado e você recebe o motivo da rejeição. Pode fazer novo upload com receita válida.

**P: Sou marcado como suspeito, como desbloquear?**
R: Você será notificado. Recomendamos contatar a farmácia para esclarecer. O admin pode investigar.

**P: Posso comprar medicamentos sem receita?**
R: Sim, medicamentos simples (sem receita) podem ser comprados normalmente.

**P: Como o sistema evita falsificação?**
R: Via validação de CRM do médico, análise manual do farmacêutico, e verificação de integridade por hash.

---

## 📞 Suporte

Dúvidas sobre o sistema de receitas?
- **Cliente**: Contate a farmácia pelo chat de suporte
- **Farmacêutico**: Consulte o manual do dashboard
- **Admin**: Verifique os logs de auditoria em Analytics > Prescription Logs
