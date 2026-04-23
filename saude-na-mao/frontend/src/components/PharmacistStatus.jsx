import React, { useState, useEffect } from 'react';
import './PharmacistStatus.css';

export function PharmacistStatus({ pharmacyId, onAvailabilityChange }) {
  const [pharmacists, setPharmaciats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacists();
    const interval = setInterval(fetchPharmacists, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, [pharmacyId]);

  const fetchPharmacists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/v1/pharmacies/${pharmacyId}/pharmacists`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setPharmaciats(data.data || []);
      
      // Notifica se há farmacêuticos disponíveis
      const hasAvailable = data.data?.some(p => p.logado);
      onAvailabilityChange?.(hasAvailable);
    } catch (error) {
      console.error('Erro ao buscar farmacêuticos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pharmacist-status loading">
        <div className="status-badge">Carregando...</div>
      </div>
    );
  }

  const available = pharmacists.filter(p => p.logado);
  const offline = pharmacists.filter(p => !p.logado);

  return (
    <div className="pharmacist-status">
      <div className="status-header">
        <h4>Farmacêuticos</h4>
        <span className={`status-indicator ${available.length > 0 ? 'online' : 'offline'}`}>
          {available.length > 0 ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>

      {available.length > 0 && (
        <div className="pharmacists-list available">
          <h5>Disponíveis agora</h5>
          {available.map(pharmacist => (
            <div key={pharmacist._id} className="pharmacist-card online">
              <div className="avatar">
                <span className="initial">{pharmacist.usuario_id?.name?.[0]}</span>
              </div>
              <div className="info">
                <p className="name">{pharmacist.usuario_id?.name || 'Farmacêutico'}</p>
                <p className="crm">CRM: {pharmacist.crm}</p>
                <div className="badges">
                  {pharmacist.crm_validado && (
                    <span className="badge verified">✓ Validado</span>
                  )}
                  <span className="badge status">{pharmacist.status_motivo}</span>
                </div>
              </div>
              <div className="stats">
                <div className="stat">
                  <strong>{pharmacist.receitas_validadas}</strong>
                  <span>Receitas</span>
                </div>
                <div className="stat">
                  <strong>{pharmacist.atendimentos_dia}</strong>
                  <span>Hoje</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {offline.length > 0 && (
        <div className="pharmacists-list offline">
          <h5>Indisponíveis</h5>
          {offline.map(pharmacist => (
            <div key={pharmacist._id} className="pharmacist-card offline">
              <div className="info-compact">
                <p className="name">{pharmacist.usuario_id?.name || 'Farmacêutico'}</p>
                <p className="crm">CRM: {pharmacist.crm}</p>
                <span className="status-motivo">
                  {pharmacist.status_motivo === 'pausa' ? '⏸️ Em pausa' : '❌ Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {available.length === 0 && offline.length === 0 && (
        <div className="no-pharmacists">
          <p>Nenhum farmacêutico cadastrado nesta farmácia</p>
        </div>
      )}
    </div>
  );
}
