import React from 'react'
import { IconX, IconBrain, IconTrendingUp, IconCoins } from '@tabler/icons-react'

export default function PortfolioDetailsModal({ opened, onClose, account }) {
  if (!opened) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Детали портфеля</h2>
          <button className="modal-close" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="portfolio-summary">
            <div className="ps-amount">
              <span className="ps-label">Общая стоимость</span>
              <div className="ps-value">
                {account?.total_value?.toLocaleString('ru-RU', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} ₽
              </div>
            </div>
            
            <div className="ps-stats">
              <div className="ps-stat">
                <div className="ps-stat-value">{account?.holdings?.length || 0}</div>
                <div className="ps-stat-label">Ценных бумаг</div>
              </div>
              <div className="ps-stat">
                <div className="ps-stat-value">RUB</div>
                <div className="ps-stat-label">Валюта</div>
              </div>
            </div>
          </div>

          <div className="portfolio-breakdown">
            <h3 className="breakdown-title">Распределение по типам</h3>
            <div className="breakdown-list">
              <div className="breakdown-item">
                <div className="breakdown-icon">
                  <IconCoins size={16} />
                </div>
                <div className="breakdown-info">
                  <div className="breakdown-name">Облигации</div>
                  <div className="breakdown-percent">65%</div>
                </div>
                <div className="breakdown-amount">1 456 386 ₽</div>
              </div>
              
              <div className="breakdown-item">
                <div className="breakdown-icon">
                  <IconTrendingUp size={16} />
                </div>
                <div className="breakdown-info">
                  <div className="breakdown-name">Акции</div>
                  <div className="breakdown-percent">35%</div>
                </div>
                <div className="breakdown-amount">781 130 ₽</div>
              </div>
            </div>
          </div>

          <div className="portfolio-actions">
            <button className="btn btn--primary btn--ai">
              <IconBrain size={16} />
              Оценка от ИИ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
