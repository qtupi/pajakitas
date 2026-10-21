/**
 * cardGenerator.js — Client-Side 3:4 Insight Card Generator (PRD R6 & R8)
 * Generates verified citizen insight cards without server involvement.
 * Exports crisp PNG using HTML5 Canvas rendering.
 */

import { dataClient } from './dataClient.js';

export class CardGenerator {
  constructor(infoPanel) {
    this.infoPanel = infoPanel;
    this.nameInput = document.getElementById('card-input-name');
    this.regionSelect = document.getElementById('card-input-region');
    this.templateRadios = document.querySelectorAll('input[name="card-template"]');
    this.previewEl = document.getElementById('card-preview');
    this.randomizeBtn = document.getElementById('card-btn-randomize');
    this.downloadBtn = document.getElementById('card-btn-download');
    this.shareBtn = document.getElementById('card-btn-share');

    // State
    this.state = {
      name: 'Warga Peduli',
      region: 'Jakarta Selatan',
      template: 'editorial', // 'editorial', 'blueprint', 'terracotta'
      selectedInsights: []
    };

    this._init();
  }

  async _init() {
    this._bindEvents();
    await this._loadInsightsForRegion(this.state.region);
    this.render();
  }

  _bindEvents() {
    if (this.nameInput) {
      this.nameInput.addEventListener('input', (e) => {
        this.state.name = e.target.value.trim() || 'Warga Peduli';
        this.render();
      });
    }

    if (this.regionSelect) {
      this.regionSelect.addEventListener('change', async (e) => {
        this.state.region = e.target.value;
        await this._loadInsightsForRegion(this.state.region);
        this.render();
      });
    }

    this.templateRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.template = e.target.value;
        this.render();
      });
    });

    if (this.randomizeBtn) {
      this.randomizeBtn.addEventListener('click', async () => {
        await this._loadInsightsForRegion(this.state.region, true);
        this.render();
      });
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadPNG());
    }

    if (this.shareBtn) {
      this.shareBtn.addEventListener('click', () => this.shareCard());
    }
  }

  async _loadInsightsForRegion(region, forceRandom = false) {
    try {
      const allInsights = await dataClient.getBankInsight();
      // Filter regional insights (matches region) + general jakarta belanja insights
      const regional = allInsights.filter(i => i.cakupan === 'wilayah' && i.wilayah === region);
      const belanja = allInsights.filter(i => i.cakupan === 'jakarta');

      // Shuffle and pick 1-2 regional + 1 belanja
      const shuffledRegional = [...regional].sort(() => 0.5 - Math.random());
      const shuffledBelanja = [...belanja].sort(() => 0.5 - Math.random());

      const chosen = [];
      if (shuffledRegional.length > 0) chosen.push(shuffledRegional[0]);
      if (shuffledRegional.length > 1) chosen.push(shuffledRegional[1]);
      if (shuffledBelanja.length > 0) chosen.push(shuffledBelanja[0]);

      this.state.selectedInsights = chosen;
    } catch (err) {
      console.error('Failed to load insights for card:', err);
    }
  }

  render() {
    if (!this.previewEl) return;

    // Remove old template classes
    this.previewEl.classList.remove('card-theme-editorial', 'card-theme-blueprint', 'card-theme-terracotta');
    this.previewEl.classList.add(`card-theme-${this.state.template}`);

    const insightsHtml = this.state.selectedInsights.map((ins, idx) => `
      <div style="margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1px dashed ${this.getBorderColor()};">
        <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.7;">
            ${ins.cakupan === 'wilayah' ? 'Penerimaan ' + ins.wilayah : 'Belanja Se-DKI Jakarta'}
          </span>
          <span style="font-family: var(--font-mono); font-size: 0.88rem; font-weight: 700;">${ins.angka}</span>
        </div>
        <p style="font-size: 0.82rem; line-height: 1.45; opacity: 0.9;">${ins.teks}</p>
      </div>
    `).join('');

    this.previewEl.innerHTML = `
      <!-- Card Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.75; margin-bottom: 0.25rem;">
            paJAK-Kita • Warga Melek Anggaran
          </div>
          <h3 style="font-size: 1.35rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15;">
            Fakta Pajak & Kota Kita
          </h3>
          <div style="font-size: 0.82rem; margin-top: 0.25rem; opacity: 0.85;">
            Wilayah: <strong style="text-decoration: underline;">${this.state.region}</strong>
          </div>
        </div>
        <img src="assets/mascot.jpg" alt="Maskot paJAK-Kita" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid ${this.getBorderColor()};" />
      </div>

      <!-- Card Insights Body -->
      <div style="margin: 1.25rem 0;">
        ${insightsHtml}
      </div>

      <!-- Card Footer -->
      <div style="border-top: 1px solid ${this.getBorderColor()}; padding-top: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <span style="font-size: 0.78rem; font-weight: 600;">Oleh: ${this.escapeHtml(this.state.name)}</span>
          <span style="font-size: 0.68rem; opacity: 0.7;">Tahun Data 2023</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; opacity: 0.75;">
          <span>Bukan Dokumen Resmi Pemerintah</span>
          <span>satudatajakarta.go.id</span>
        </div>
      </div>
    `;
  }

  getBorderColor() {
    if (this.state.template === 'blueprint') return 'rgba(0, 240, 255, 0.35)';
    if (this.state.template === 'terracotta') return 'rgba(194, 65, 12, 0.3)';
    return 'rgba(17, 17, 17, 0.2)';
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  downloadPNG() {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1440; // 3:4 Aspect Ratio
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Template Colors
    let bgColor = '#F8F7F4';
    let textColor = '#111111';
    let accentColor = '#0284C7';
    let subTextColor = '#52525B';
    let borderColor = '#111111';

    if (this.state.template === 'blueprint') {
      bgColor = '#0A192F';
      textColor = '#F1F5F9';
      accentColor = '#00F0FF';
      subTextColor = '#94A3B8';
      borderColor = '#00F0FF';
    } else if (this.state.template === 'terracotta') {
      bgColor = '#FFF7ED';
      textColor = '#7C2D12';
      accentColor = '#EA580C';
      subTextColor = '#9A3412';
      borderColor = '#EA580C';
    }

    // 1. Draw Canvas Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle Dot Pattern for Blueprint/Editorial
    ctx.fillStyle = this.state.template === 'blueprint' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)';
    for (let x = 40; x < width; x += 36) {
      for (let y = 40; y < height; y += 36) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Outer Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner Thin Line
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // Header Tag
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PAJAK-KITA • PUSAT TRANSPARANSI PUBLIK', 80, 110);

    // Title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('Fakta Pajak & Kota Kita', 80, 180);

    // Region Pill
    ctx.fillStyle = textColor;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`Wilayah: ${this.state.region}`, 80, 230);

    // Divider Line
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 270);
    ctx.lineTo(width - 80, 270);
    ctx.stroke();

    // Draw Insights
    let currentY = 350;
    this.state.selectedInsights.forEach((ins, idx) => {
      // Category & Number
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`${ins.cakupan === 'wilayah' ? 'PENERIMAAN ' + ins.wilayah.toUpperCase() : 'BELANJA SE-DKI JAKARTA'}`, 80, currentY);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 44px monospace';
      ctx.fillText(ins.angka, 80, currentY + 50);

      // Paragraph wrapping
      ctx.fillStyle = subTextColor;
      ctx.font = '28px sans-serif';
      const words = ins.teks.split(' ');
      let line = '';
      let lineY = currentY + 105;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > (width - 160) && n > 0) {
          ctx.fillText(line, 80, lineY);
          line = words[n] + ' ';
          lineY += 40;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 80, lineY);

      currentY = lineY + 90;

      // Dashed separator
      if (idx < this.state.selectedInsights.length - 1) {
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(80, currentY - 30);
        ctx.lineTo(width - 80, currentY - 30);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Footer divider
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, height - 220);
    ctx.lineTo(width - 80, height - 220);
    ctx.stroke();

    // Footer info
    ctx.fillStyle = textColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`Dibuat oleh: ${this.state.name}`, 80, height - 160);

    ctx.fillStyle = subTextColor;
    ctx.font = '22px sans-serif';
    ctx.fillText('Sumber: satudatajakarta.go.id (Tahun 2023)', 80, height - 120);
    ctx.fillText('Bukan Dokumen Resmi Pemerintah • Buka pajakkita.id', 80, height - 85);

    // Mascot thumbnail in bottom right
    const img = new Image();
    img.src = 'assets/mascot.jpg';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(width - 150, height - 145, 65, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, width - 215, height - 210, 130, 130);
      ctx.restore();

      // Trigger download
      const link = document.createElement('a');
      link.download = `paJAK-Kita-${this.state.region.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.onerror = () => {
      // Trigger download even if image fails
      const link = document.createElement('a');
      link.download = `paJAK-Kita-${this.state.region.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

  shareCard() {
    if (navigator.share) {
      navigator.share({
        title: `Fakta Pajak Daerah paJAK-Kita: ${this.state.region}`,
        text: `Lihat dan verifikasi aliran pajak daerah Jakarta di paJAK-Kita. Saya menemukan fakta pajak terkumpul di ${this.state.region}!`,
        url: window.location.href
      }).catch(err => console.log('Share dismissed:', err));
    } else {
      this.downloadPNG();
    }
  }
}
