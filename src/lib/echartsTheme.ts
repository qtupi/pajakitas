/**
 * paJAK-Kita — Tema ECharts Terstandarisasi
 * File: src/lib/echartsTheme.ts
 *
 * Mengambil token warna dan font dari CSS variables paJAK-Kita.
 */

import { getVizPalette } from './vizColors.ts';

export function getEchartsTheme() {
  const fontBase = 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif';
  const palette = getVizPalette();

  return {
    color: palette,
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: fontBase,
      color: '#1F1A17',
    },
    title: {
      textStyle: {
        fontFamily: fontBase,
        fontWeight: 800,
        color: '#1F1A17',
        fontSize: 16,
      },
      subtextStyle: {
        fontFamily: fontBase,
        color: '#6B6159',
        fontSize: 13,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#E6DACB',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: {
        fontFamily: fontBase,
        color: '#1F1A17',
        fontSize: 12,
      },
      extraCssText:
        'box-shadow: 0 8px 24px rgba(31, 26, 23, 0.12); border-radius: 8px; backdrop-filter: blur(8px);',
    },
    legend: {
      textStyle: {
        fontFamily: fontBase,
        color: '#1F1A17',
        fontSize: 12,
      },
      pageIconColor: '#B91C1C',
      pageIconInactiveColor: '#E6DACB',
      pageTextStyle: {
        color: '#6B6159',
      },
    },
    grid: {
      containLabel: true,
      borderColor: '#E6DACB',
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: '#E6DACB',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6B6159',
        fontFamily: fontBase,
        fontSize: 11,
      },
      splitLine: {
        show: false,
      },
    },
    valueAxis: {
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6B6159',
        fontFamily: fontBase,
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: '#F2E8DA',
          type: 'dashed',
        },
      },
    },
  };
}
