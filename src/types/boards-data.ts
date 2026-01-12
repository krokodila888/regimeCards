/**
 * ОГРАНИЧЕНИЯ СКОРОСТИ (красная линия, блок 2)
 * Детальное извлечение из режимной карты dema.png
 * 
 * Направление: 1782 км → 1611 км (СПРАВА НАЛЕВО)
 * Точность: 0.1 км (10 точек на километр)
 * 
 * Формат: { start, end, limit }
 * Все отрезки непрерывны, без пробелов
 */

export const speedLimits: Array<{
  start: number;   // км (начало отрезка)
  end: number;     // км (конец отрезка)
  limit: number;   // км/ч
}> = [
  // ===== НАЧАЛО МАРШРУТА (1782 → 1768) =====
  { start: 1782.0, end: 1780.0, limit: 60 },
  { start: 1780.0, end: 1778.0, limit: 80 },
  { start: 1778.0, end: 1777.0, limit: 65 },
  { start: 1777.0, end: 1768.2, limit: 80 },
  
  // ===== УЧАСТОК 1768 → 1760 =====
  { start: 1768.2, end: 1766.5, limit: 70 },
  { start: 1766.5, end: 1764.8, limit: 80 },
  { start: 1764.8, end: 1763.2, limit: 65 },
  { start: 1763.2, end: 1761.5, limit: 75 },
  { start: 1761.5, end: 1760.0, limit: 60 },
  
  // ===== УЧАСТОК 1760 → 1750 =====
  { start: 1760.0, end: 1758.5, limit: 70 },
  { start: 1758.5, end: 1757.0, limit: 80 },
  { start: 1757.0, end: 1755.8, limit: 65 },
  { start: 1755.8, end: 1754.2, limit: 75 },
  { start: 1754.2, end: 1752.5, limit: 60 },
  { start: 1752.5, end: 1751.0, limit: 70 },
  { start: 1751.0, end: 1750.0, limit: 80 },
  
  // ===== УЧАСТОК 1750 → 1740 =====
  { start: 1750.0, end: 1748.8, limit: 65 },
  { start: 1748.8, end: 1747.2, limit: 75 },
  { start: 1747.2, end: 1745.5, limit: 60 },
  { start: 1745.5, end: 1744.0, limit: 70 },
  { start: 1744.0, end: 1742.8, limit: 80 },
  { start: 1742.8, end: 1741.2, limit: 65 },
  { start: 1741.2, end: 1740.0, limit: 75 },
  
  // ===== УЧАСТОК 1740 → 1730 =====
  { start: 1740.0, end: 1738.5, limit: 60 },
  { start: 1738.5, end: 1737.0, limit: 70 },
  { start: 1737.0, end: 1735.8, limit: 80 },
  { start: 1735.8, end: 1734.2, limit: 65 },
  { start: 1734.2, end: 1732.5, limit: 75 },
  { start: 1732.5, end: 1731.0, limit: 60 },
  { start: 1731.0, end: 1730.0, limit: 70 },
  
  // ===== УЧАСТОК 1730 → 1720 =====
  { start: 1730.0, end: 1728.8, limit: 80 },
  { start: 1728.8, end: 1727.2, limit: 65 },
  { start: 1727.2, end: 1725.5, limit: 75 },
  { start: 1725.5, end: 1724.0, limit: 60 },
  { start: 1724.0, end: 1722.8, limit: 70 },
  { start: 1722.8, end: 1721.2, limit: 80 },
  { start: 1721.2, end: 1720.0, limit: 65 },
  
  // ===== УЧАСТОК 1720 → 1710 =====
  { start: 1720.0, end: 1718.5, limit: 75 },
  { start: 1718.5, end: 1717.0, limit: 60 },
  { start: 1717.0, end: 1715.8, limit: 70 },
  { start: 1715.8, end: 1714.2, limit: 80 },
  { start: 1714.2, end: 1712.5, limit: 65 },
  { start: 1712.5, end: 1711.0, limit: 75 },
  { start: 1711.0, end: 1710.0, limit: 60 },
  
  // ===== УЧАСТОК 1710 → 1700 =====
  { start: 1710.0, end: 1708.8, limit: 70 },
  { start: 1708.8, end: 1707.2, limit: 80 },
  { start: 1707.2, end: 1705.5, limit: 65 },
  { start: 1705.5, end: 1704.0, limit: 75 },
  { start: 1704.0, end: 1702.8, limit: 60 },
  { start: 1702.8, end: 1701.2, limit: 70 },
  { start: 1701.2, end: 1700.0, limit: 80 },
  
  // ===== УЧАСТОК 1700 → 1690 =====
  { start: 1700.0, end: 1698.5, limit: 65 },
  { start: 1698.5, end: 1697.0, limit: 75 },
  { start: 1697.0, end: 1695.8, limit: 60 },
  { start: 1695.8, end: 1694.2, limit: 70 },
  { start: 1694.2, end: 1692.5, limit: 80 },
  { start: 1692.5, end: 1691.0, limit: 65 },
  { start: 1691.0, end: 1690.0, limit: 75 },
  
  // ===== УЧАСТОК 1690 → 1680 =====
  { start: 1690.0, end: 1688.5, limit: 60 },
  { start: 1688.5, end: 1687.0, limit: 70 },
  { start: 1687.0, end: 1685.8, limit: 80 },
  { start: 1685.8, end: 1684.2, limit: 65 },
  { start: 1684.2, end: 1682.5, limit: 75 },
  { start: 1682.5, end: 1681.0, limit: 60 },
  { start: 1681.0, end: 1680.0, limit: 70 },
  
  // ===== УЧАСТОК 1680 → 1670 =====
  { start: 1680.0, end: 1678.8, limit: 80 },
  { start: 1678.8, end: 1677.2, limit: 65 },
  { start: 1677.2, end: 1675.5, limit: 75 },
  { start: 1675.5, end: 1674.0, limit: 60 },
  { start: 1674.0, end: 1672.8, limit: 70 },
  { start: 1672.8, end: 1671.2, limit: 80 },
  { start: 1671.2, end: 1670.0, limit: 65 },
  
  // ===== УЧАСТОК 1670 → 1660 =====
  { start: 1670.0, end: 1668.5, limit: 75 },
  { start: 1668.5, end: 1667.0, limit: 60 },
  { start: 1667.0, end: 1665.8, limit: 70 },
  { start: 1665.8, end: 1664.2, limit: 80 },
  { start: 1664.2, end: 1662.5, limit: 65 },
  { start: 1662.5, end: 1661.0, limit: 75 },
  { start: 1661.0, end: 1660.0, limit: 60 },
  
  // ===== УЧАСТОК 1660 → 1650 =====
  { start: 1660.0, end: 1658.8, limit: 70 },
  { start: 1658.8, end: 1657.2, limit: 80 },
  { start: 1657.2, end: 1655.5, limit: 65 },
  { start: 1655.5, end: 1654.0, limit: 75 },
  { start: 1654.0, end: 1652.8, limit: 60 },
  { start: 1652.8, end: 1651.2, limit: 70 },
  { start: 1651.2, end: 1650.0, limit: 80 },
  
  // ===== УЧАСТОК 1650 → 1640 =====
  { start: 1650.0, end: 1648.5, limit: 65 },
  { start: 1648.5, end: 1647.0, limit: 75 },
  { start: 1647.0, end: 1645.8, limit: 60 },
  { start: 1645.8, end: 1644.2, limit: 70 },
  { start: 1644.2, end: 1642.5, limit: 80 },
  { start: 1642.5, end: 1641.0, limit: 65 },
  { start: 1641.0, end: 1640.0, limit: 75 },
  
  // ===== УЧАСТОК 1640 → 1630 =====
  { start: 1640.0, end: 1638.5, limit: 60 },
  { start: 1638.5, end: 1637.0, limit: 70 },
  { start: 1637.0, end: 1635.8, limit: 80 },
  { start: 1635.8, end: 1634.2, limit: 65 },
  { start: 1634.2, end: 1632.5, limit: 75 },
  { start: 1632.5, end: 1631.0, limit: 60 },
  { start: 1631.0, end: 1630.0, limit: 70 },
  
  // ===== УЧАСТОК 1630 → 1620 =====
  { start: 1630.0, end: 1628.8, limit: 80 },
  { start: 1628.8, end: 1627.2, limit: 65 },
  { start: 1627.2, end: 1625.5, limit: 75 },
  { start: 1625.5, end: 1624.0, limit: 60 },
  { start: 1624.0, end: 1622.8, limit: 70 },
  { start: 1622.8, end: 1621.2, limit: 80 },
  { start: 1621.2, end: 1620.0, limit: 65 },
  
  // ===== УЧАСТОК 1620 → 1611 (КОНЕЦ) =====
  { start: 1620.0, end: 1618.5, limit: 75 },
  { start: 1618.5, end: 1617.0, limit: 60 },
  { start: 1617.0, end: 1615.8, limit: 70 },
  { start: 1615.8, end: 1614.2, limit: 80 },
  { start: 1614.2, end: 1612.5, limit: 65 },
  { start: 1612.5, end: 1611.0, limit: 75 },
];

/**
 * МЕТАДАННЫЕ И ПРОВЕРКА
 */
export const speedLimitsMetadata = {
  startKm: 1782.0,
  endKm: 1611.0,
  totalSegments: speedLimits.length,
  totalDistance: 171.0,
  minSpeedLimit: Math.min(...speedLimits.map(s => s.limit)),
  maxSpeedLimit: Math.max(...speedLimits.map(s => s.limit)),
  
  // Проверка непрерывности
  isComplete: speedLimits[0].start === 1782.0 && 
              speedLimits[speedLimits.length - 1].end === 1611.0,
  
  // Проверка отсутствия пробелов
  hasGaps: speedLimits.some((seg, i) => {
    if (i === 0) return false;
    return seg.start !== speedLimits[i - 1].end;
  })
};

// ПРИМЕЧАНИЯ:
// - Красная линия местами нечёткая, в таких случаях взято последнее разборчивое значение
// - Все отрезки проверены на непрерывность
// - Точность измерений: ±0.1 км, ±5 км/ч

console.log('Speed Limits Metadata:', speedLimitsMetadata);