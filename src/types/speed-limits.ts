export const speedLimits: Array<{
  start: number; // км (начало отрезка)
  end: number; // км (конец отрезка)
  limit: number; // км/ч
}> = [
  // ===== НАЧАЛО МАРШРУТА (1782 → 1768) =====
  { start: 1782.0, end: 1780.0, limit: 60 },
  { start: 1780.0, end: 1778.0, limit: 80 },
  { start: 1778.0, end: 1777.0, limit: 65 },
  { start: 1777.0, end: 1768.2, limit: 80 },

  // ===== УЧАСТОК 1768 → 1760 =====
  { start: 1768.2, end: 1764.7, limit: 65 },
  { start: 1764.7, end: 1753.9, limit: 80 },
  { start: 1753.9, end: 1745.5, limit: 60 },
  { start: 1745.5, end: 1745.0, limit: 70 },
  { start: 1745.0, end: 1743.7, limit: 60 },

  // ===== УЧАСТОК 1750 → 1700 =====
  { start: 1743.7, end: 1742.0, limit: 80 },
  { start: 1742.0, end: 1724.9, limit: 60 },
  { start: 1724.9, end: 1715.0, limit: 80 },
  { start: 1715.0, end: 1712.3, limit: 70 },
  { start: 1712.3, end: 1702.4, limit: 80 },
  { start: 1702.4, end: 1701.1, limit: 60 },
  { start: 1701.1, end: 1695.8, limit: 80 },

  // ===== УЧАСТОК 1700 → 1690 =====
  { start: 1695.8, end: 1695.3, limit: 70 },
  { start: 1695.3, end: 1693.9, limit: 65 },
  { start: 1693.9, end: 1692.5, limit: 60 },
  { start: 1692.5, end: 1675.9, limit: 80 },
  { start: 1675.9, end: 1674.5, limit: 60 },
  { start: 1674.5, end: 1643.5, limit: 80 },
  { start: 1643.5, end: 1642.7, limit: 60 },
  { start: 1642.7, end: 1635.2, limit: 80 },
  { start: 1635.2, end: 1634.0, limit: 70 },
  { start: 1634.0, end: 1632.0, limit: 60 },
  { start: 1632.0, end: 1628.4, limit: 70 },
  { start: 1628.4, end: 1620.5, limit: 60 },
  { start: 1620.5, end: 1616.3, limit: 80 },
  { start: 1616.3, end: 1615.5, limit: 50 },
  { start: 1615.5, end: 1612.7, limit: 80 },
  { start: 1612.7, end: 1612.5, limit: 40 },
  { start: 1612.5, end: 1612.3, limit: 80 },
  { start: 1612.3, end: 1610.0, limit: 70 },
];

/**
 * МЕТАДАННЫЕ И ПРОВЕРКА
 */
export const speedLimitsMetadata = {
  startKm: 1782.0,
  endKm: 1611.0,
  totalSegments: speedLimits.length,
  totalDistance: 171.0,
  minSpeedLimit: Math.min(...speedLimits.map((s) => s.limit)),
  maxSpeedLimit: Math.max(...speedLimits.map((s) => s.limit)),

  // Проверка непрерывности
  isComplete: speedLimits[0].start === 1782.0 && speedLimits[speedLimits.length - 1].end === 1611.0,

  // Проверка отсутствия пробелов
  hasGaps: speedLimits.some((seg, i) => {
    if (i === 0) return false;
    return seg.start !== speedLimits[i - 1].end;
  }),
};

// ПРИМЕЧАНИЯ:
// - Красная линия местами нечёткая, в таких случаях взято последнее разборчивое значение
// - Все отрезки проверены на непрерывность
// - Точность измерений: ±0.1 км, ±5 км/ч

console.log('Speed Limits Metadata:', speedLimitsMetadata);
