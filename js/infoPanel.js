/**
 * infoPanel.js — Contextual information drawer (PRD R10)
 * Activated when clicking charts, stats, or badges.
 */

import { dataClient } from './dataClient.js';

export class InfoPanel {
  constructor() {
    this.backdrop = document.getElementById('infopanel-backdrop');
    this.drawer = document.getElementById('infopanel-drawer');
    this.titleEl = document.getElementById('infopanel-title');
    this.descEl = document.getElementById('infopanel-desc');
    this.formulaEl = document.getElementById('infopanel-formula');
    this.sourceEl = document.getElementById('infopanel-source');
    this.notesEl = document.getElementById('infopanel-notes');
    this.closeBtn = document.getElementById('infopanel-close');

    this._bindEvents();
  }

  _bindEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  async open(panelId) {
    if (!this.drawer || !this.backdrop) return;
    
    try {
      const def = await dataClient.getDefinisiPanel(panelId);
      if (!def) {
        console.warn(`Definition not found for id: ${panelId}`);
        return;
      }

      this.titleEl.textContent = def.judul;
      this.descEl.textContent = def.penjelasan;
      this.formulaEl.textContent = def.cara_hitung;
      this.sourceEl.textContent = Array.isArray(def.dataset) ? def.dataset.join(', ') : def.dataset;
      this.notesEl.textContent = def.catatan;

      this.backdrop.classList.add('active');
      this.drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Error opening info panel:', err);
    }
  }

  close() {
    if (!this.drawer || !this.backdrop) return;
    this.drawer.classList.remove('active');
    this.backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}
