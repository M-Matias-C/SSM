import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/store';
import './PharmacistDashboard.css';

const API_BASE = 'http://localhost:5000/api/v1/pharmacists';
const REFRESH_INTERVAL = 30000; // 30 segundos

export function PharmacistDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState({
    validacoes_pendentes: 0,
    alertas_ativos: 0,
    receitas_validadas_hoje: 0,
    atendimentos_media_resposta: 0,
  });

  const [pendingValidations, setPendingValidations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validatingId, setValidatingId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    try {
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, validationsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`, { headers }),
        fetch(`${API_BASE}/dashboard/validations/pending`, { headers }),
        fetch(`${API_BASE}/dashboard/alerts`, { headers }),
      ]);

      // Stats
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data || {});
      } else if (!statsRes.ok && statsRes.status !== 404) {
        throw new Error(`Erro ao carregar estatísticas (${statsRes.status})`);
      }

      // Validations
      if (validationsRes.ok) {
        const data = await validationsRes.json();
        setPendingValidations(data.data || []);
      } else if (!validationsRes.ok && validationsRes.status !== 404) {
        throw new Error(`Erro ao carregar validações (${validationsRes.status})`);
      }

      // Alerts
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.data || []);
      } else if (!alertsRes.ok && alertsRes.status !== 404) {
        throw new Error(`Erro ao carregar alertas (${alertsRes.status})`);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Erro ao carregar dados do servidor');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleValidation = async (validationId, approved) => {
    try {
      setValidatingId(validationId);
      const response = await fetch(
        `${API_BASE}/validations/${validationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            aprovado: approved,
            motivo: approved ? 'Aprovado pela farmacêutico' : 'Recusado pela farmacêutico',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao validar prescrição (${response.status})`);
      }

      setPendingValidations(prev => prev.filter(v => v._id !== validationId));
      await fetchData();
    } catch (err) {
      console.error('Erro ao validar:', err);
      setError(err.message || 'Erro ao processar validação');
    } finally {
      setValidatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="pharmacist-dashboard">
        <SkeletonHeader />
        <SkeletonStatsGrid />
        <SkeletonContent />
      </div>
    );
  }

  return (
    <div className="pharmacist-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>🧑‍⚕️ Dashboard do Farmacêutico</h1>
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={fetchData} className="retry-btn">Tentar Novamente</button>
            </div>
          )}
        </div>
        <div className="status-indicator">
          <span className="dot online"></span>
          Online - Pronto para atender
        </div>
      </header>

      <div className="stats-grid">
        <StatCard
          title="Validações Pendentes"
          value={stats.validacoes_pendentes}
          icon="⏳"
          color="orange"
        />
        <StatCard
          title="Alertas Ativos"
          value={stats.alertas_ativos}
          icon="🚨"
          color="red"
        />
        <StatCard
          title="Receitas Validadas Hoje"
          value={stats.receitas_validadas_hoje}
          icon="✓"
          color="green"
        />
        <StatCard
          title="Tempo Médio de Resposta"
          value={`${Math.round(stats.atendimentos_media_resposta)}min`}
          icon="⏱️"
          color="blue"
        />
      </div>

      <div className="dashboard-content">
        <section className="validations-section">
          <h2>⏳ Validações Pendentes</h2>
          {pendingValidations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>Nenhuma validação pendente</p>
              <small>Tudo certo! Você está em dia com as análises.</small>
            </div>
          ) : (
            <div className="validations-list">
              {pendingValidations.map(validation => (
                <ValidationCard
                  key={validation._id}
                  validation={validation}
                  onApprove={() => handleValidation(validation._id, true)}
                  onReject={() => handleValidation(validation._id, false)}
                  isLoading={validatingId === validation._id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="alerts-section">
          <h2>🚨 Alertas Recentes</h2>
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <p>Nenhum alerta no momento</p>
              <small>Sistema funcionando perfeitamente.</small>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map(alert => (
                <AlertCard key={alert._id} alert={alert} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="refresh-indicator">
        ↻ Próxima atualização em {Math.round(REFRESH_INTERVAL / 1000)}s
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClass = `color-${color}`;
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="icon">{icon}</div>
      <div className="content">
        <p className="label">{title}</p>
        <p className="value">{value}</p>
      </div>
    </div>
  );
}

function ValidationCard({ validation, onApprove, onReject, isLoading }) {
  return (
    <div className="validation-card">
      <div className="header">
        <h3>Pedido #{validation.pedido_numero}</h3>
        <span className={`severity ${validation.severidade_maxima}`}>
          {validation.severidade_maxima}
        </span>
      </div>

      <div className="medicamentos">
        <h4>Medicamentos:</h4>
        <ul>
          {validation.medicamentos.map((med, idx) => (
            <li key={idx}>{med.nome}</li>
          ))}
        </ul>
      </div>

      {validation.interacoes && validation.interacoes.length > 0 && (
        <div className="interacoes">
          <h4>⚠️ Interações Detectadas:</h4>
          {validation.interacoes.map((inter, idx) => (
            <div key={idx} className="interacao">
              <p>
                <strong>{inter.medicamento1}</strong> + <strong>{inter.medicamento2}</strong>
              </p>
              <p className="efeito">{inter.efeitos[0]}</p>
            </div>
          ))}
        </div>
      )}

      <div className="cliente-info">
        <p>
          <strong>Cliente:</strong> {validation.cliente_nome} ({validation.cliente_email})
        </p>
        <p>
          <strong>Recomendação IA:</strong> {validation.recomendacao_final}
        </p>
      </div>

      <div className="actions">
        <button 
          className="btn-approve" 
          onClick={onApprove}
          disabled={isLoading}
          title={isLoading ? 'Processando...' : 'Aprovar prescrição'}
        >
          {isLoading ? '⏳ Processando...' : '✓ Aprovar'}
        </button>
        <button 
          className="btn-reject" 
          onClick={onReject}
          disabled={isLoading}
          title={isLoading ? 'Processando...' : 'Recusar prescrição'}
        >
          {isLoading ? '⏳ Processando...' : '✗ Recusar'}
        </button>
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  const severityColors = {
    LEVE: '#10b981',
    MODERADA: '#f59e0b',
    GRAVE: '#ef4444',
    CONTRAINDICADA: '#8b5cf6',
  };

  return (
    <div className="alert-card">
      <div
        className="left-border"
        style={{ borderColor: severityColors[alert.severidade] }}
      />
      <div className="content">
        <h4>{alert.titulo}</h4>
        <p>{alert.descricao}</p>
        <span className="time">{formatTime(alert.criado_em)}</span>
      </div>
    </div>
  );
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Agora mesmo';
  if (diff < 3600) return `Há ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('pt-BR');
}

// Skeleton Loaders para melhor UX durante carregamento
function SkeletonHeader() {
  return (
    <div className="skeleton-header">
      <div className="skeleton-text skeleton-title"></div>
    </div>
  );
}

function SkeletonStatsGrid() {
  return (
    <div className="skeleton-stats-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-card"></div>
      ))}
    </div>
  );
}

function SkeletonContent() {
  return (
    <div className="skeleton-content">
      <div className="skeleton-section">
        <div className="skeleton-text skeleton-heading"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-card skeleton-validation"></div>
        ))}
      </div>
      <div className="skeleton-section">
        <div className="skeleton-text skeleton-heading"></div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton-card skeleton-alert"></div>
        ))}
      </div>
    </div>
  );
}

export default PharmacistDashboard
