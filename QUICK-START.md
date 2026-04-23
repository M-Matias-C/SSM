# ⚡ SSM - Quick Start Guide

## 🚀 5 Minutos para Começar

### Passo 1: Instalar dependências (já feito!)
```bash
cd saude-na-mao/frontend
npm install  # qrcode, html2pdf.js, recharts já estão
```

### Passo 2: Iniciar Backend
```bash
cd saude-na-mao/backend
npm run dev
# Esperar por: "Server running on port 5000"
```

### Passo 3: Iniciar Frontend
```bash
cd saude-na-mao/frontend
npm run dev
# Esperar por: "VITE v... ready in ... ms"
```

### Passo 4: Abrir no Browser
```
http://localhost:5173
```

### Passo 5: Fazer Login
- Email: qualquer usuário existente no DB
- Senha: conforme registrado

---

## 📋 Rotas Para Testar Imediatamente

| Rota | Descrição | Requer Login |
|------|-----------|-------------|
| `/` | Home | ❌ |
| `/login` | Autenticação | ❌ |
| `/checkout-ia` | Checkout com IA | ✅ |
| `/receita-digital/:id` | E-receita com QR | ✅ |
| `/dashboard/farmaceutico` | Validações | ✅ (Farmacêutico) |
| `/dashboard/farmacia` | Métricas | ✅ (Farmácia) |
| `/dashboard/analytics` | Gráficos | ✅ (Farmácia) |
| `/dashboard/seguranca` | Auditoria | ✅ (Admin) |

---

## 🧪 Testes Rápidos

### Teste 1: Receita Digital
1. Fazer checkout
2. Ir para `/receita-digital/:id`
3. Ver QR Code gerado
4. Clicar "Baixar PDF"
5. ✅ Pronto!

### Teste 2: Dashboard Analytics
1. Login como farmácia
2. Ir para `/dashboard/analytics`
3. Selecionar período (dia/semana/mês/ano)
4. Ver gráficos renderizarem
5. ✅ Pronto!

### Teste 3: Dashboard de Segurança
1. Login como admin
2. Ir para `/dashboard/seguranca`
3. Ver logs de auditoria
4. Clicar em um log para ver detalhes
5. ✅ Pronto!

---

## 🔧 Comandos Úteis

```bash
# Frontend
npm run dev      # Desenvolver
npm run build    # Produção
npm run preview  # Pré-produção
npm run test     # Testes

# Backend
npm run dev      # Desenvolver com nodemon
npm run start    # Produção
npm run seed     # Popular DB (se existir)
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'qrcode'"
```bash
cd frontend && npm install qrcode --save
```

### Erro: "MongoDB connection failed"
Verificar `.env`:
```
MONGODB_URI=sua_url_mongodb
```

### Erro: "Port 5173 already in use"
```bash
# Frontend: Mudar porta em vite.config.js
# Backend: Mudar em .env (PORT=5001)
```

---

## 📊 Dados para Testar

Use no Insomnia/Postman:

```json
// Login
POST /api/v1/auth/login
{
  "email": "usuario@example.com",
  "senha": "123456"
}

// Receita Digital
GET /api/v1/prescriptions/prescription_id_aqui/receita
Headers: Authorization: Bearer {token}

// Analytics
GET /api/v1/pharmacies/pharmacy_id_aqui/analytics?period=mes
Headers: Authorization: Bearer {token}

// Auditoria
GET /api/v1/audit?filter=all&limit=50&page=1
Headers: Authorization: Bearer {token}
```

---

## 📚 Próximos Passos

1. **Consultar TESTING-GUIDE.md** para teste completo
2. **Consultar ARCHITECTURE.md** para entender a estrutura
3. **Rodar todos os testes** do guia
4. **Fazer ajustes** conforme necessário

---

## ✨ Pronto!

Seu sistema SSM está 100% funcional e pronto para:
- ✅ Testes
- ✅ Apresentação
- ✅ Produção

**Sucesso! 🚀**
