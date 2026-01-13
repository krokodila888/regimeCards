export const regimesData = {
  definitions: {},
  points: [
    { distance: 0, regime: 'a' },
    { distance: 951, regime: 'b' },
    { distance: 1168, regime: 'c' },
    { distance: 2023, regime: 'E' },
    { distance: 2974, regime: 'c' },
    { distance: 3552, regime: 'd' },
    { distance: 3800, regime: 'E' },
    { distance: 5985, regime: 'c' },
    { distance: 7015, regime: 'E' },
    { distance: 12079, regime: 'd' },
    { distance: 13600, regime: 'E' },
    { distance: 18294, regime: 'c' },
    { distance: 19309, regime: 'E' },
    { distance: 26020, regime: 'e' },
    { distance: 26230, regime: 'c' },
    { distance: 27324, regime: 'd' },
    { distance: 27900, regime: 'e' },
    { distance: 28274, regime: 'c' },
    { distance: 29984, regime: 'b' },
    { distance: 31754, regime: 'c' },
    { distance: 33767, regime: 'E' },
    { distance: 37818, regime: 'e' },
    { distance: 37904, regime: 'c' },
    { distance: 39143, regime: 'E' },
    { distance: 39294, regime: 'c' },
    { distance: 40324, regime: 'E' },
    { distance: 42500, regime: 'e' },
    { distance: 42533, regime: 'c' },
    { distance: 54823, regime: 'b' },
    { distance: 57043, regime: 'c' },
    { distance: 63828, regime: 'b' },
    { distance: 70626, regime: 'c' },
    { distance: 72542, regime: 'E' },
    { distance: 75361, regime: 'c' },
    { distance: 79151, regime: 'd' },
    { distance: 79400, regime: 'c' },
    { distance: 80967, regime: 'b' },
    { distance: 81346, regime: 'c' },
    { distance: 82160, regime: 'b' },
    { distance: 96955, regime: 'c' },
    { distance: 99704, regime: 'E' },
    { distance: 104356, regime: 'c' },
    { distance: 104779, regime: 'E' },
    { distance: 104879, regime: 'd' },
    { distance: 105900, regime: 'E' },
    { distance: 106210, regime: 'e' },
    { distance: 106400, regime: 'c' },
    { distance: 107431, regime: 'E' },
    { distance: 107768, regime: 'e' },
    { distance: 107899, regime: 'c' },
    { distance: 113658, regime: 'b' },
    { distance: 115059, regime: 'c' },
    { distance: 124402, regime: 'b' },
    { distance: 125116, regime: 'c' },
    { distance: 127577, regime: 'b' },
    { distance: 129286, regime: 'c' },
    { distance: 134158, regime: 'b' },
    { distance: 134731, regime: 'c' },
    { distance: 138300, regime: 'E' },
    { distance: 139395, regime: 'e' },
    { distance: 139473, regime: 'c' },
    { distance: 146382, regime: 'b' },
    { distance: 153579, regime: 'c' },
    { distance: 154331, regime: 'E' },
    { distance: 156425, regime: 'c' },
    { distance: 157708, regime: 'E' },
    { distance: 160870, regime: 'e' },
    { distance: 161073, regime: 'c' },
    { distance: 163512, regime: 'b' },
    { distance: 165438, regime: 'c' },
    { distance: 165500, regime: 'e' },
    { distance: 166234, regime: 'E' },
    { distance: 167474, regime: 'c' },
    { distance: 168791, regime: 'd' },
    { distance: 169100, regime: 'e' },
    { distance: 170474, regime: 'c' },
    { distance: 171705, regime: 'd' },
  ],
};

// Оптимальные режимы ведения (извлечено из dema_opt1_2.bmp)
// Диапазон: 1782.0 → 1610.0 км (172 км)
// Количество сегментов: 73
// Масштаб: 74.99 px/км (12898×13 пикселей)

// Типы режимов:
// - 'traction': Режим тяги
// - 'coasting': Выбег
// - 'braking': Торможение
// - 'speed_limit': Поддержание скорости

// Цвета режимов:
// - 'blue': #0000c0 - Синий (тяга)
// - 'cyan': #788cff - Голубой (тяга под ограничение)
// - 'yellow': #ffff00 - Жёлтый (поддержание скорости)
// - 'green': #49d913 - Зелёный (выбег)
// - 'orange': #ffaa00 - Оранжевый (торможение под ограничение)
// - 'red': #ff0000 - Красный (РТ или Т 0.8)

export type RegimeType = 'traction' | 'coasting' | 'braking' | 'speed_limit';
export type RegimeColor = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan';

export interface OptimalRegimeSegment {
  id: string;
  startKm: number;
  endKm: number;
  type: RegimeType;
  color: RegimeColor;
  label?: string;
}

export const optimalRegimes: OptimalRegimeSegment[] = [
  { id: 'seg1', startKm: 1781.8, endKm: 1780.9, type: 'traction', color: 'blue' },
  { id: 'seg2', startKm: 1780.9, endKm: 1780.6, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg3', startKm: 1780.6, endKm: 1779.7, type: 'coasting', color: 'green' },
  { id: 'seg4', startKm: 1779.7, endKm: 1778.8, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg5', startKm: 1778.8, endKm: 1778.3, type: 'coasting', color: 'green' },
  { id: 'seg6', startKm: 1778.2, endKm: 1778.0, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg7', startKm: 1778.0, endKm: 1775.8, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg8', startKm: 1775.8, endKm: 1774.8, type: 'coasting', color: 'green' },
  { id: 'seg9', startKm: 1774.8, endKm: 1769.7, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg10', startKm: 1769.7, endKm: 1768.2, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg11', startKm: 1768.2, endKm: 1763.5, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg12', startKm: 1763.5, endKm: 1762.5, type: 'coasting', color: 'green' },
  { id: 'seg13', startKm: 1762.5, endKm: 1755.8, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg14', startKm: 1755.8, endKm: 1755.6, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg15', startKm: 1755.6, endKm: 1754.5, type: 'coasting', color: 'green' },
  { id: 'seg16', startKm: 1754.5, endKm: 1753.9, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg17', startKm: 1753.9, endKm: 1753.5, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg18', startKm: 1753.5, endKm: 1751.6, type: 'coasting', color: 'green' },
  { id: 'seg19', startKm: 1751.6, endKm: 1750.0, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg20', startKm: 1750.0, endKm: 1748.0, type: 'coasting', color: 'green' },
  { id: 'seg21', startKm: 1748.0, endKm: 1744.0, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg22', startKm: 1744.0, endKm: 1743.9, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg23', startKm: 1743.9, endKm: 1742.6, type: 'coasting', color: 'green' },
  { id: 'seg24', startKm: 1742.6, endKm: 1742.5, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg25', startKm: 1742.5, endKm: 1741.5, type: 'coasting', color: 'green' },
  { id: 'seg26', startKm: 1741.5, endKm: 1739.3, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg27', startKm: 1739.3, endKm: 1739.3, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg28', startKm: 1739.2, endKm: 1726.8, type: 'coasting', color: 'green' },
  { id: 'seg29', startKm: 1726.8, endKm: 1724.8, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg30', startKm: 1724.7, endKm: 1717.9, type: 'coasting', color: 'green' },
  { id: 'seg31', startKm: 1717.9, endKm: 1711.2, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg32', startKm: 1711.1, endKm: 1709.2, type: 'coasting', color: 'green' },
  { id: 'seg33', startKm: 1709.2, endKm: 1706.4, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg34', startKm: 1706.4, endKm: 1702.6, type: 'coasting', color: 'green' },
  { id: 'seg35', startKm: 1702.6, endKm: 1702.4, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg36', startKm: 1702.4, endKm: 1699.5, type: 'coasting', color: 'green' },
  { id: 'seg37', startKm: 1699.5, endKm: 1684.8, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg38', startKm: 1684.8, endKm: 1682.0, type: 'coasting', color: 'green' },
  { id: 'seg39', startKm: 1682.0, endKm: 1677.4, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg40', startKm: 1677.4, endKm: 1677.0, type: 'coasting', color: 'green' },
  { id: 'seg41', startKm: 1677.0, endKm: 1676.9, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg42', startKm: 1676.9, endKm: 1675.9, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg43', startKm: 1675.9, endKm: 1675.6, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg44', startKm: 1675.6, endKm: 1675.4, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg45', startKm: 1675.4, endKm: 1674.4, type: 'coasting', color: 'green' },
  { id: 'seg46', startKm: 1674.3, endKm: 1674.0, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg47', startKm: 1674.0, endKm: 1673.9, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg48', startKm: 1673.9, endKm: 1668.1, type: 'coasting', color: 'green' },
  { id: 'seg49', startKm: 1668.1, endKm: 1665.0, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg50', startKm: 1665.0, endKm: 1654.1, type: 'coasting', color: 'green' },
  { id: 'seg51', startKm: 1654.0, endKm: 1652.5, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg52', startKm: 1652.5, endKm: 1647.6, type: 'coasting', color: 'green' },
  { id: 'seg53', startKm: 1647.6, endKm: 1647.0, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg54', startKm: 1647.0, endKm: 1643.5, type: 'coasting', color: 'green' },
  { id: 'seg55', startKm: 1643.5, endKm: 1642.4, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg56', startKm: 1642.4, endKm: 1642.3, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg57', startKm: 1642.3, endKm: 1635.3, type: 'coasting', color: 'green' },
  { id: 'seg58', startKm: 1635.3, endKm: 1628.2, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg59', startKm: 1628.2, endKm: 1627.4, type: 'coasting', color: 'green' },
  { id: 'seg60', startKm: 1627.4, endKm: 1625.3, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg61', startKm: 1625.3, endKm: 1624.1, type: 'coasting', color: 'green' },
  { id: 'seg62', startKm: 1624.1, endKm: 1620.9, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg63', startKm: 1620.9, endKm: 1620.7, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg64', startKm: 1620.7, endKm: 1618.1, type: 'coasting', color: 'green' },
  { id: 'seg65', startKm: 1618.1, endKm: 1615.5, type: 'speed_limit', color: 'yellow', label: 'Поддержание' },
  { id: 'seg66', startKm: 1615.5, endKm: 1615.4, type: 'coasting', color: 'green' },
  { id: 'seg67', startKm: 1615.4, endKm: 1614.3, type: 'braking', color: 'orange', label: 'Т под огр.' },
  { id: 'seg68', startKm: 1614.3, endKm: 1613.0, type: 'coasting', color: 'green' },
  { id: 'seg69', startKm: 1613.0, endKm: 1612.7, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg70', startKm: 1612.7, endKm: 1611.4, type: 'traction', color: 'cyan', label: 'Т под огр.' },
  { id: 'seg71', startKm: 1611.4, endKm: 1610.1, type: 'coasting', color: 'green' },
  { id: 'seg72', startKm: 1610.1, endKm: 1610.0, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg73', startKm: 1610.0, endKm: 1610.0, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
];

// Оптимальные режимы ведения - ВЕРСИЯ 2 (извлечено из dema_opt1_1.bmp)
// Диапазон: 1782.0 → 1610.0 км (172 км)
// Количество сегментов: 72
// Масштаб: 74.99 px/км (12898×43 пикселей)
// ПРИМЕЧАНИЕ: Упрощённая версия с меньшим количеством режимов

// Цвета в этой версии:
// - 'blue': #0000c0 - Синий (тяга) - менее 1%
// - 'green': #49d913 - Зелёный (выбег) - 50%
// - 'red': #ff0000 - Красный (РТ или Т 0.8) - 25%

export type RegimeType1 = 'traction' | 'coasting' | 'braking' | 'speed_limit';
export type RegimeColor1 = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan';

export interface OptimalRegimeSegment {
  id: string;
  startKm: number;
  endKm: number;
  type: RegimeType1;
  color: RegimeColor1;
}

export const optimalRegimesV2: OptimalRegimeSegment[] = [
  { id: 'seg1', startKm: 1781.8, endKm: 1781.8, type: 'traction', color: 'blue' },
  { id: 'seg2', startKm: 1781.8, endKm: 1781.7, type: 'traction', color: 'blue' },
  { id: 'seg3', startKm: 1780.6, endKm: 1780.5, type: 'traction', color: 'blue' },
  { id: 'seg4', startKm: 1780.5, endKm: 1779.7, type: 'coasting', color: 'green' },
  { id: 'seg5', startKm: 1779.7, endKm: 1778.9, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg6', startKm: 1778.9, endKm: 1778.5, type: 'coasting', color: 'green' },
  { id: 'seg7', startKm: 1778.5, endKm: 1777.4, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg8', startKm: 1777.4, endKm: 1777.3, type: 'coasting', color: 'green' },
  { id: 'seg9', startKm: 1776.6, endKm: 1775.3, type: 'coasting', color: 'green' },
  { id: 'seg10', startKm: 1775.3, endKm: 1763.3, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg11', startKm: 1763.2, endKm: 1762.8, type: 'coasting', color: 'green' },
  { id: 'seg12', startKm: 1762.8, endKm: 1760.7, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg13', startKm: 1760.7, endKm: 1760.2, type: 'coasting', color: 'green' },
  { id: 'seg14', startKm: 1760.2, endKm: 1757.8, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg15', startKm: 1757.8, endKm: 1757.4, type: 'coasting', color: 'green' },
  { id: 'seg16', startKm: 1757.4, endKm: 1755.8, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg17', startKm: 1755.8, endKm: 1754.6, type: 'coasting', color: 'green' },
  { id: 'seg18', startKm: 1754.6, endKm: 1753.8, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg19', startKm: 1753.8, endKm: 1751.9, type: 'coasting', color: 'green' },
  { id: 'seg20', startKm: 1751.9, endKm: 1751.9, type: 'traction', color: 'blue' },
  { id: 'seg21', startKm: 1750.4, endKm: 1750.4, type: 'traction', color: 'blue' },
  { id: 'seg22', startKm: 1750.4, endKm: 1748.1, type: 'coasting', color: 'green' },
  { id: 'seg23', startKm: 1748.1, endKm: 1746.4, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg24', startKm: 1746.4, endKm: 1745.7, type: 'coasting', color: 'green' },
  { id: 'seg25', startKm: 1745.7, endKm: 1744.2, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg26', startKm: 1744.2, endKm: 1741.3, type: 'coasting', color: 'green' },
  { id: 'seg27', startKm: 1741.3, endKm: 1740.0, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg28', startKm: 1740.0, endKm: 1727.0, type: 'coasting', color: 'green' },
  { id: 'seg29', startKm: 1727.0, endKm: 1726.9, type: 'traction', color: 'blue' },
  { id: 'seg30', startKm: 1725.1, endKm: 1725.0, type: 'traction', color: 'blue' },
  { id: 'seg31', startKm: 1725.0, endKm: 1716.7, type: 'coasting', color: 'green' },
  { id: 'seg32', startKm: 1716.7, endKm: 1716.6, type: 'traction', color: 'blue' },
  { id: 'seg33', startKm: 1711.3, endKm: 1711.2, type: 'traction', color: 'blue' },
  { id: 'seg34', startKm: 1711.2, endKm: 1709.3, type: 'coasting', color: 'green' },
  { id: 'seg35', startKm: 1709.3, endKm: 1706.5, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg36', startKm: 1706.5, endKm: 1703.4, type: 'coasting', color: 'green' },
  { id: 'seg37', startKm: 1703.4, endKm: 1702.9, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg38', startKm: 1702.9, endKm: 1699.3, type: 'coasting', color: 'green' },
  { id: 'seg39', startKm: 1699.3, endKm: 1699.2, type: 'traction', color: 'blue' },
  { id: 'seg40', startKm: 1685.1, endKm: 1685.1, type: 'traction', color: 'blue' },
  { id: 'seg41', startKm: 1685.1, endKm: 1681.9, type: 'coasting', color: 'green' },
  { id: 'seg42', startKm: 1681.9, endKm: 1678.9, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg43', startKm: 1678.9, endKm: 1678.6, type: 'coasting', color: 'green' },
  { id: 'seg44', startKm: 1678.6, endKm: 1675.7, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg45', startKm: 1675.7, endKm: 1668.7, type: 'coasting', color: 'green' },
  { id: 'seg46', startKm: 1668.7, endKm: 1668.7, type: 'traction', color: 'blue' },
  { id: 'seg47', startKm: 1665.6, endKm: 1665.5, type: 'traction', color: 'blue' },
  { id: 'seg48', startKm: 1665.5, endKm: 1654.4, type: 'coasting', color: 'green' },
  { id: 'seg49', startKm: 1654.3, endKm: 1654.3, type: 'traction', color: 'blue' },
  { id: 'seg50', startKm: 1654.3, endKm: 1654.3, type: 'traction', color: 'blue' },
  { id: 'seg51', startKm: 1652.4, endKm: 1647.9, type: 'coasting', color: 'green' },
  { id: 'seg52', startKm: 1647.8, endKm: 1647.8, type: 'traction', color: 'blue' },
  { id: 'seg53', startKm: 1646.9, endKm: 1646.9, type: 'traction', color: 'blue' },
  { id: 'seg54', startKm: 1646.9, endKm: 1643.6, type: 'coasting', color: 'green' },
  { id: 'seg55', startKm: 1643.6, endKm: 1642.5, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg56', startKm: 1642.5, endKm: 1635.8, type: 'coasting', color: 'green' },
  { id: 'seg57', startKm: 1635.8, endKm: 1635.8, type: 'traction', color: 'blue' },
  { id: 'seg58', startKm: 1635.8, endKm: 1635.8, type: 'traction', color: 'blue' },
  { id: 'seg59', startKm: 1628.5, endKm: 1628.5, type: 'traction', color: 'blue' },
  { id: 'seg60', startKm: 1628.4, endKm: 1627.5, type: 'coasting', color: 'green' },
  { id: 'seg61', startKm: 1627.5, endKm: 1625.6, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg62', startKm: 1625.6, endKm: 1624.3, type: 'coasting', color: 'green' },
  { id: 'seg63', startKm: 1624.3, endKm: 1621.3, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg64', startKm: 1621.3, endKm: 1618.6, type: 'coasting', color: 'green' },
  { id: 'seg65', startKm: 1618.6, endKm: 1618.5, type: 'traction', color: 'blue' },
  { id: 'seg66', startKm: 1617.0, endKm: 1617.0, type: 'traction', color: 'blue' },
  { id: 'seg67', startKm: 1617.0, endKm: 1614.5, type: 'coasting', color: 'green' },
  { id: 'seg68', startKm: 1614.5, endKm: 1612.6, type: 'braking', color: 'red', label: 'РТ/Т0.8' },
  { id: 'seg69', startKm: 1612.6, endKm: 1612.2, type: 'coasting', color: 'green' },
  { id: 'seg70', startKm: 1612.2, endKm: 1612.1, type: 'traction', color: 'blue' },
  { id: 'seg71', startKm: 1610.8, endKm: 1610.8, type: 'traction', color: 'blue' },
  { id: 'seg72', startKm: 1610.8, endKm: 1610.3, type: 'coasting', color: 'green' },
];