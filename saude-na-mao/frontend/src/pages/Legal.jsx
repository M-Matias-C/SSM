import { useState } from 'react'
import { ChevronDown, CheckCircle, Shield, FileText, HelpCircle } from 'lucide-react'

const TABS = [
  { id: 'termos', label: 'Termos de Uso', icon: FileText },
  { id: 'privacidade', label: 'Política de Privacidade', icon: Shield },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
]

const FAQS = [
  {
    id: 1,
    pergunta: 'Como funciona o processo de compra?',
    resposta:
      'O processo é simples: navegue pelos produtos, adicione ao carrinho, faça login ou cadastro, escolha a forma de pagamento e acompanhe a entrega. Você receberá atualizações por email.',
  },
  {
    id: 2,
    pergunta: 'Qual é o prazo de entrega?',
    resposta:
      'O prazo varia de 2 a 7 dias úteis dependendo da sua localização. Você acompanhará o pedido em tempo real através da aba "Rastreamento".',
  },
  {
    id: 3,
    pergunta: 'Posso conversar com um farmacêutico?',
    resposta:
      'Sim! Entre em contato com nossa central de atendimento usando o chat de suporte. Você será conectado a um farmacêutico disponível que poderá responder suas dúvidas sobre medicamentos, efeitos colaterais e interações.',
  },
  {
    id: 4,
    pergunta: 'Como faço para usar uma receita digital?',
    resposta:
      'Você pode fazer upload da sua receita médica na aba "Receitas". Nossa equipe a validará e você poderá comprar os medicamentos prescritos diretamente.',
  },
  {
    id: 5,
    pergunta: 'Quais são as formas de pagamento?',
    resposta:
      'Aceitamos cartão de crédito, débito, Pix, boleto e diversos métodos de pagamento digital. Todos são seguros e criptografados.',
  },
  {
    id: 6,
    pergunta: 'Posso devolver um produto?',
    resposta:
      'Sim, você tem 30 dias para devolver produtos não abertos. Entre em contato com nosso suporte para iniciar o processo de devolução.',
  },
  {
    id: 7,
    pergunta: 'Como meus dados estão protegidos?',
    resposta:
      'Usamos criptografia SSL de 256 bits e estamos em conformidade com a LGPD. Nunca compartilhamos dados pessoais com terceiros sem consentimento.',
  },
  {
    id: 8,
    pergunta: 'Como faço login se esqueci a senha?',
    resposta:
      'Na página de login, clique em "Esqueci minha senha". Enviaremos um email com um link para redefinir sua senha.',
  },
]

const TERMOS_CONTENT = `
# Termos de Uso - Saúde na Mão

**Última atualização: 15 de Abril de 2026**

## 1. Aceitação dos Termos
Ao acessar e usar a plataforma Saúde na Mão, você concorda em cumprir estes Termos de Uso. Se não concordar, por favor, não use nossos serviços.

## 2. Descrição do Serviço
Saúde na Mão é uma plataforma de e-commerce farmacêutico que permite:
- Compra de medicamentos e produtos de saúde
- Utilização de receitas digitais
- Consulta com farmacêuticos
- Rastreamento de pedidos
- Gestão de seu perfil e histórico de compras

## 3. Direitos de Uso
Você concorda em usar o serviço apenas para:
- Finalidades legais e permitidas
- Sua própria conta e benefício pessoal
- Não violar direitos intelectuais ou de propriedade

## 4. Proibições
Você não pode:
- Usar informações de outros usuários
- Tentar acessar áreas restritas
- Prejudicar ou interromper o serviço
- Vender ou distribuir produtos adquiridos pela plataforma
- Contornar medidas de segurança

## 5. Responsabilidades do Usuário
- Manter a confidencialidade de sua senha
- Notificar-nos imediatamente de abusos
- Fornecer informações precisas no cadastro
- Respeitar os direitos de outros usuários

## 6. Medicamentos e Receitas
- Todos os medicamentos controlados requerem receita válida
- Farmacêuticos qualificados validarão as receitas
- Não nos responsabilizamos por reações adversas não informadas
- Consulte um médico antes de usar novos medicamentos

## 7. Limitação de Responsabilidade
A plataforma é fornecida "como está". Não garantimos:
- Disponibilidade contínua do serviço
- Ausência de erros ou interrupções
- Resultados específicos de saúde

## 8. Modificações dos Termos
Reservamos o direito de modificar estes termos a qualquer momento. As mudanças serão comunicadas por email.

## 9. Rescisão
Podemos encerrar sua conta se violar estes Termos de Uso.

## 10. Lei Aplicável
Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
`.trim()

const PRIVACIDADE_CONTENT = `
# Política de Privacidade - Saúde na Mão

**Última atualização: 15 de Abril de 2026**

## 1. Coleta de Dados
Coletamos as seguintes informações:
- **Dados de Cadastro**: Nome, email, telefone, CPF, endereço
- **Dados de Compra**: Produtos, datas, valores, métodos de pagamento
- **Dados de Saúde**: Receitas médicas, alergias informadas
- **Dados de Navegação**: IP, tipo de navegador, páginas visitadas

## 2. Uso dos Dados
Usamos seus dados para:
- Processar compras e entregas
- Melhorar nossos serviços
- Comunicar-se sobre sua conta
- Conformidade legal e segurança
- Análise de tendências (dados anônimos)

## 3. Proteção de Dados
- Usamos criptografia SSL 256 bits
- Conformidade total com LGPD (Lei Geral de Proteção de Dados)
- Acesso restrito a servidores seguros
- Senhas armazenadas com hash bcrypt

## 4. Compartilhamento de Dados
**Nunca compartilhamos seus dados com:**
- Anunciantes ou terceiros (sem consentimento)
- Agências governamentais (exceto por lei)
- Qualquer serviço não essencial

**Compartilhamos apenas com:**
- Farmácias parceiras (para processar pedidos)
- Transportadoras (para entrega)
- Processadores de pagamento (dados criptografados)

## 5. Direitos do Titular de Dados
Você tem direito a:
- Acessar seus dados
- Corrigir informações incorretas
- Solicitar exclusão de dados
- Portabilidade de dados
- Revogação de consentimento

Para exercer esses direitos, envie email para: privacidade@saudenamaao.com

## 6. Retenção de Dados
- Dados de cadastro: Mantidos enquanto sua conta estiver ativa
- Dados de compra: Mantidos por 5 anos (obrigação fiscal)
- Dados de navegação: Mantidos por 30 dias
- Dados de receita: Mantidos conforme legislação farmacêutica

## 7. Cookies
Usamos cookies para:
- Manter sua sessão autenticada
- Melhorar experiência do usuário
- Analisar uso da plataforma

Você pode desabilitar cookies nas configurações do navegador.

## 8. Segurança
- Auditorias de segurança regulares
- Equipe dedicada a proteção de dados
- Monitoramento 24/7 de atividades suspeitas
- Política de resposta a incidentes

## 9. Alterações na Política
Notificaremos por email sobre mudanças significativas.

## 10. Contato
**Data Protection Officer:**
Email: privacidade@saudenamaao.com
Telefone: (11) 3000-0000
`.trim()

export default function Legal() {
  const [activeTab, setActiveTab] = useState('termos')
  const [expandedFAQ, setExpandedFAQ] = useState(null)

  const renderTabContent = () => {
    switch (activeTab) {
      case 'termos':
        return (
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            {TERMOS_CONTENT.split('\n').map((line, index) => {
              if (line.startsWith('#')) {
                const level = line.match(/^#+/)[0].length
                const text = line.replace(/^#+\s/, '')
                return level === 1 ? (
                  <h1 key={index} className="text-3xl font-bold text-gray-900 mt-6 mb-4">
                    {text}
                  </h1>
                ) : (
                  <h2 key={index} className="text-xl font-bold text-gray-800 mt-4 mb-2">
                    {text}
                  </h2>
                )
              }
              if (line.trim()) {
                return (
                  <p key={index} className="text-sm leading-relaxed">
                    {line}
                  </p>
                )
              }
              return <div key={index} />
            })}
          </div>
        )

      case 'privacidade':
        return (
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            {PRIVACIDADE_CONTENT.split('\n').map((line, index) => {
              if (line.startsWith('#')) {
                const level = line.match(/^#+/)[0].length
                const text = line.replace(/^#+\s/, '')
                return level === 1 ? (
                  <h1 key={index} className="text-3xl font-bold text-gray-900 mt-6 mb-4">
                    {text}
                  </h1>
                ) : (
                  <h2 key={index} className="text-xl font-bold text-gray-800 mt-4 mb-2">
                    {text}
                  </h2>
                )
              }
              if (line.trim()) {
                return (
                  <p key={index} className="text-sm leading-relaxed">
                    {line}
                  </p>
                )
              }
              return <div key={index} />
            })}
          </div>
        )

      case 'faq':
        return (
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition text-left"
                >
                  <h3 className="font-semibold text-gray-800 text-sm">{faq.pergunta}</h3>
                  <ChevronDown
                    size={20}
                    className={`text-gray-500 transition ${
                      expandedFAQ === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 py-3 bg-blue-50 border-t border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.resposta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Documentos Legais</h1>
          <p className="text-gray-600">
            Conheça nossos Termos de Uso, Política de Privacidade e respostas frequentes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200 flex-wrap sm:flex-nowrap">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 font-medium text-sm transition border-b-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">{renderTabContent()}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Seguro & Confiável</h3>
            <p className="text-sm text-gray-600">
              Certificado e criptografado com SSL 256 bits
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow text-center">
            <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Conformidade LGPD</h3>
            <p className="text-sm text-gray-600">
              Em total conformidade com a Lei Geral de Proteção de Dados
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow text-center">
            <HelpCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Dúvidas?</h3>
            <p className="text-sm text-gray-600">
              Entre em contato conosco através do suporte
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mt-8 text-center border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Precisa de Ajuda?</h2>
          <p className="text-gray-700 mb-4">
            Se tiver dúvidas sobre nossos termos ou política de privacidade, entre em contato:
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              📧 Email:{' '}
              <a href="mailto:legal@saudenamaao.com" className="text-blue-600 hover:underline">
                legal@saudenamaao.com
              </a>
            </p>
            <p className="text-sm">
              📞 Telefone:{' '}
              <a href="tel:+551130000000" className="text-blue-600 hover:underline">
                (11) 3000-0000
              </a>
            </p>
            <p className="text-sm">
              💬 Chat de Suporte: Use o ícone de chat na página
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
