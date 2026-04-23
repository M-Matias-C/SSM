import React, { useState, useEffect } from 'react';
import './PharmacistDashboard.css';

export function PharmacistDashboard() {
  const [stats, setStats] = useState({
    validacoes_pendentes: 0,
    alertas_ativos: 0,
    receitas_validadas_hoje: 0,
    atendimentos_media_resposta: 0,
  });

  const [pendingValidations, setPendingValidations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, validationsRes, alertsRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/pharmacist/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/v1/pharmacist/validations/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/v1/pharmacist/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
      if (validationsRes.ok) {
        const data = await validationsRes.json();
        setPendingValidations(data.data);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (validationId, approved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/pharmacist/validations/${validationId}`,
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

      if (response.ok) {
        // Remover da lista e atualizar stats
        setPendingValidations(prev => prev.filter(v => v._id !== validationId));
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="pharmacist-dashboard">
      <header className="dashboard-header">
        <h1>🧑‍⚕️ Dashboard do Farmacêutico</h1>
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
              <p>Nenhuma validação pendente</p>
            </div>
          ) : (
            <div className="validations-list">
              {pendingValidations.map(validation => (
                <ValidationCard
                  key={validation._id}
                  validation={validation}
                  onApprove={() => handleValidation(validation._id, true)}
                  onReject={() => handleValidation(validation._id, false)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="alerts-section">
          <h2>🚨 Alertas Recentes</h2>
          {alerts.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum alerta no momento</p>
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

function ValidationCard({ validation, onApprove, onReject }) {
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
        <button className="btn-approve" onClick={onApprove}>
          ✓ Aprovar
        </button>
        <button className="btn-reject" onClick={onReject}>
          ✗ Recusar
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

export default PharmacistDashboard
