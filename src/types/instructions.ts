/**
 * IMPORTED REGIME MAP DATA
 *
 * Этот модуль объединяет все извлечённые данные из режимной карты:
 * - Ограничения скорости (speed limits)
 * - Продольные силы (longitudinal forces)
 * - Кривые скорости (speed curves: optimal, actual, limit)
 *
 * Все данные извлечены из BMP-файлов высокого качества.
 */

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export interface SpeedLimit {
  start: number; // км (начало отрезка)
  end: number; // км (конец отрезка)
  limit: number; // км/ч (целое число)
}

export interface LongitudinalForce {
  distance: number; // км
  tension: number; // кН (растяжение, >= 0)
  compression: number; // кН (сжатие, >= 0)
}

export interface SpeedCurvePoint {
  distance: number; // км
  speedLimit: number | null; // км/ч (красная - ограничения)
  optimalSpeed: number | null; // км/ч (синяя - оптимальная)
  actualSpeed: number | null; // км/ч (зелёная - фактическая)
}

// ============================================================================
// ИМПОРТ ДАННЫХ
// ============================================================================

// Ограничения скорости (119 сегментов, 1782→1610 км)

// Продольные силы (3434 точки, 1781.8→1610.1 км, 20 точек/км)
import { longitudinalForces as rawLongitudinalForces } from './longitudinal-forces-correct';

// Кривые скорости (1718 точек, 1781.8→1610.1 км, 10 точек/км)
import {
  longitudinalForces,
  speedCurvePoints,
  speedLimits,
  regimeMapMetadata,
  getForceAtDistance,
  getSpeedAtDistance,
} from './regime-map-data';
import { speedCurves as rawSpeedCurves } from './speed-curves';

// ============================================================================
// ЭКСПОРТ ДАННЫХ
// ============================================================================

/**
 * Ограничения скорости по участкам
 * 119 сегментов, покрывают весь маршрут 1782→1610 км без пробелов
 */
export const speedLimits: SpeedLimit[] = rawSpeedLimits;

/**
 * Продольные силы растяжения/сжатия
 * 3434 точки с шагом 0.05 км (20 точек на километр)
 * Диапазон: 1781.8 → 1610.1 км
 */
export const longitudinalForces: LongitudinalForce[] = rawLongitudinalForces;

/**
 * Три кривые скорости:
 * - speedLimit: красная линия (ограничения)
 * - optimalSpeed: синяя линия (оптимальная)
 * - actualSpeed: зелёная линия (фактическая)
 *
 * 1718 точек с шагом 0.1 км (10 точек на километр)
 * Диапазон: 1781.8 → 1610.1 км
 */
export const speedCurvePoints: SpeedCurvePoint[] = rawSpeedCurves;

// ============================================================================
// МЕТАДАННЫЕ
// ============================================================================

export const regimeMapMetadata = {
  // Координаты участка
  startKm: 1782.0,
  endKm: 1610.0,
  totalLength: 172.0, // км

  // Рабочий диапазон (с учётом отступов null-зон)
  workStartKm: 1781.8,
  workEndKm: 1610.1,
  workLength: 171.7, // км

  // Плотность данных
  forcesPointsPerKm: 20,
  speedPointsPerKm: 10,
  speedLimitSegments: 119,

  // Диапазоны значений
  ranges: {
    tension: { min: 0, max: 108 }, // кН
    compression: { min: 0, max: 120.5 }, // кН
    speed: { min: 0, max: 80 }, // км/ч
  },

  // Источники данных
  sources: {
    forces: 'dema1.bmp (12890x204)',
    speeds: 'dema2.bmp (12916x491)',
    extractionMethod: 'automatic_bmp_pixel_analysis',
  },
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить силу в точке (интерполяция между ближайшими точками)
 */
export function getForceAtDistance(km: number): LongitudinalForce | null {
  if (km < regimeMapMetadata.workStartKm || km > regimeMapMetadata.workEndKm) {
    return null;
  }

  // Найти ближайшую точку
  const closest = longitudinalForces.reduce((prev, curr) =>
    Math.abs(curr.distance - km) < Math.abs(prev.distance - km) ? curr : prev
  );

  return closest;
}

/**
 * Получить скорости в точке (интерполяция)
 */
export function getSpeedAtDistance(km: number): SpeedCurvePoint | null {
  if (km < regimeMapMetadata.workStartKm || km > regimeMapMetadata.workEndKm) {
    return null;
  }

  const closest = speedCurvePoints.reduce((prev, curr) =>
    Math.abs(curr.distance - km) < Math.abs(prev.distance - km) ? curr : prev
  );

  return closest;
}

/**
 * Получить ограничение скорости в точке
 */
export function getSpeedLimitAtDistance(km: number): number | null {
  const segment = speedLimits.find((s) => km >= s.start && km < s.end);
  return segment ? segment.limit : null;
}

/**
 * Фильтр данных по диапазону координат
 */
export function filterDataByRange(startKm: number, endKm: number) {
  return {
    forces: longitudinalForces.filter((f) => f.distance >= startKm && f.distance <= endKm),
    speeds: speedCurvePoints.filter((s) => s.distance >= startKm && s.distance <= endKm),
    limits: speedLimits.filter((l) => l.end >= startKm && l.start <= endKm),
  };
}

/**
 * PATCH FOR ChartEditor.tsx - Stage 1: Connect Extracted Data
 *
 * Этот файл содержит изменения для подключения извлечённых данных режимной карты.
 *
 * ИЗМЕНЕНИЯ:
 * 1. Импорт данных из regime-map-data.ts
 * 2. Отрисовка продольных сил (LAYER 1)
 * 3. Отрисовка кривых скорости (LAYER 2)
 * 4. Отрисовка ограничений скорости (LAYER 2)
 */

// ============================================================================
// 1. ДОБАВИТЬ ИМПОРТЫ В НАЧАЛО ФАЙЛА
// ============================================================================

// После существующих импортов добавить:
import { speedLimits as rawSpeedLimits } from './speed-limits-precise';

// ============================================================================
// 2. LAYER 1: ОТРИСОВКА ПРОДОЛЬНЫХ СИЛ (заменить существующий код)
// ============================================================================

/*
Найти в функции drawWorkflowCanvas код:
// ====================================
// LAYER 1: TENSION/COMPRESSION FORCE DYNAMICS (0-160px)
// ====================================

Заменить весь блок отрисовки на:
*/

if (displaySettings.trackProfile) {
  // Используем этот флаг для показа сил
  const layer1Top = LAYER1_TOP + 10;
  const layer1Bottom = LAYER1_TOP + LAYER1_HEIGHT - 10;
  const layer1Center = (layer1Top + layer1Bottom) / 2;
  const layer1Height = layer1Bottom - layer1Top;

  // Draw layer border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = lineWidth(1);
  ctx.strokeRect(marginLeft, LAYER1_TOP, chartWidth, LAYER1_HEIGHT);

  // Draw baseline (zero line)
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = lineWidth(2);
  ctx.beginPath();
  ctx.moveTo(marginLeft, layer1Center);
  ctx.lineTo(marginLeft + chartWidth, layer1Center);
  ctx.stroke();

  // Y-шкала от -130 до +110 (как на оригинале)
  const maxTension = 110; // кН
  const maxCompression = 130; // кН (отображается как отрицательное)

  ctx.save();
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = lineWidth(0.5);
  ctx.fillStyle = '#6b7280';
  ctx.font = fontSize(10);
  ctx.textAlign = 'right';
  ctx.setLineDash([2, 2]);

  // Сетка для растяжения (выше нуля)
  for (let force = 0; force <= maxTension; force += 20) {
    const ratio = force / maxTension;
    const y = layer1Center - ratio * (layer1Height / 2);

    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(marginLeft + chartWidth, y);
    ctx.stroke();

    if (force % 40 === 0) {
      ctx.fillText(`${force}`, marginLeft - 5, y + 3);
    }
  }

  // Сетка для сжатия (ниже нуля)
  for (let force = 0; force <= maxCompression; force += 20) {
    const ratio = force / maxCompression;
    const y = layer1Center + ratio * (layer1Height / 2);

    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(marginLeft + chartWidth, y);
    ctx.stroke();

    if (force % 40 === 0) {
      ctx.fillText(`-${force}`, marginLeft - 5, y + 3);
    }
  }

  ctx.setLineDash([]);
  ctx.restore();

  // ОТРИСОВКА КРИВЫХ ИЗ ИЗВЛЕЧЁННЫХ ДАННЫХ
  if (longitudinalForces && longitudinalForces.length > 0) {
    // Фильтруем точки в видимом диапазоне
    const visibleForces = longitudinalForces.filter(
      (f) => f.distance >= displayStartCoord && f.distance <= displayEndCoord
    );

    if (visibleForces.length > 0) {
      // Красная кривая - растяжение
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = lineWidth(2);
      ctx.beginPath();
      let tensionStarted = false;

      visibleForces.forEach((point) => {
        if (point.tension > 0) {
          const x = kmToX(point.distance);
          const ratio = point.tension / maxTension;
          const y = layer1Center - ratio * (layer1Height / 2);

          if (!tensionStarted) {
            ctx.moveTo(x, y);
            tensionStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      if (tensionStarted) {
        ctx.stroke();
      }

      // Синяя кривая - сжатие
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = lineWidth(2);
      ctx.beginPath();
      let compressionStarted = false;

      visibleForces.forEach((point) => {
        if (point.compression > 0) {
          const x = kmToX(point.distance);
          const ratio = point.compression / maxCompression;
          const y = layer1Center + ratio * (layer1Height / 2);

          if (!compressionStarted) {
            ctx.moveTo(x, y);
            compressionStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      if (compressionStarted) {
        ctx.stroke();
      }
    }
  }

  // Подпись слоя
  ctx.save();
  ctx.translate(marginLeft - 60, layer1Top + layer1Height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#374151';
  ctx.font = fontSize(11);
  ctx.textAlign = 'center';
  ctx.fillText('Силы (кН)', 0, 0);
  ctx.restore();
}

// ============================================================================
// 3. LAYER 2: КРИВЫЕ СКОРОСТИ (добавить после сетки)
// ============================================================================

/*
Найти в LAYER 2 код отрисовки кривых скорости.
Заменить/дополнить следующим кодом:
*/

// ОГРАНИЧЕНИЯ СКОРОСТИ (красная линия) - из извлечённых данных
if (displaySettings.speedLimits && speedLimits && speedLimits.length > 0) {
  const visibleLimits = speedLimits.filter(
    (limit) => limit.end >= displayStartCoord && limit.start <= displayEndCoord
  );

  if (visibleLimits.length > 0) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = lineWidth(2.5);
    ctx.beginPath();

    let lastSpeed = visibleLimits[0].limit;
    const firstLimit = visibleLimits[0];
    const firstX = kmToX(Math.max(displayStartCoord, firstLimit.start));
    ctx.moveTo(firstX, speedToY(lastSpeed));

    visibleLimits.forEach((limit) => {
      const segmentStart = Math.max(displayStartCoord, limit.start);
      const segmentEnd = Math.min(displayEndCoord, limit.end);

      const startX = kmToX(segmentStart);
      const endX = kmToX(segmentEnd);
      const y = speedToY(limit.limit);

      // Вертикальный переход при смене ограничения
      if (limit.limit !== lastSpeed) {
        ctx.lineTo(startX, speedToY(lastSpeed));
        ctx.lineTo(startX, y);
      } else {
        ctx.lineTo(startX, y);
      }

      ctx.lineTo(endX, y);
      lastSpeed = limit.limit;
    });

    ctx.stroke();

    // Подпись
    ctx.fillStyle = '#ef4444';
    ctx.font = fontSize(10);
    ctx.textAlign = 'left';
    ctx.fillText('Ограничения', marginLeft + 10, layer2Top + 15);
  }
}

// ОПТИМАЛЬНАЯ КРИВАЯ (синяя линия)
if (displaySettings.optimalSpeedCurve && speedCurvePoints && speedCurvePoints.length > 0) {
  const visiblePoints = speedCurvePoints.filter(
    (p) =>
      p.distance >= displayStartCoord && p.distance <= displayEndCoord && p.optimalSpeed !== null
  );

  if (visiblePoints.length > 0) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = lineWidth(2);
    ctx.setLineDash([5, 3]);
    ctx.beginPath();

    const firstPoint = visiblePoints[0];
    ctx.moveTo(kmToX(firstPoint.distance), speedToY(firstPoint.optimalSpeed!));

    for (let i = 1; i < visiblePoints.length; i++) {
      const point = visiblePoints[i];
      ctx.lineTo(kmToX(point.distance), speedToY(point.optimalSpeed!));
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Подпись
    ctx.fillStyle = '#3b82f6';
    ctx.font = fontSize(10);
    ctx.textAlign = 'left';
    ctx.fillText('Оптимальная', marginLeft + 10, layer2Top + 30);
  }
}

// ФАКТИЧЕСКАЯ КРИВАЯ (зелёная линия)
if (displaySettings.actualSpeedCurve && speedCurvePoints && speedCurvePoints.length > 0) {
  const visiblePoints = speedCurvePoints.filter(
    (p) =>
      p.distance >= displayStartCoord && p.distance <= displayEndCoord && p.actualSpeed !== null
  );

  if (visiblePoints.length > 0) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = lineWidth(2.5);
    ctx.beginPath();

    const firstPoint = visiblePoints[0];
    ctx.moveTo(kmToX(firstPoint.distance), speedToY(firstPoint.actualSpeed!));

    for (let i = 1; i < visiblePoints.length; i++) {
      const point = visiblePoints[i];
      ctx.lineTo(kmToX(point.distance), speedToY(point.actualSpeed!));
    }

    ctx.stroke();

    // Подпись
    ctx.fillStyle = '#22c55e';
    ctx.font = fontSize(10);
    ctx.textAlign = 'left';
    ctx.fillText('Фактическая', marginLeft + 10, layer2Top + 45);
  }
}

// ============================================================================
// 4. ОБНОВИТЬ ЗАВИСИМОСТИ useCallback для drawWorkflowCanvas
// ============================================================================

/*
В зависимостях drawWorkflowCanvas добавить:
*/
[
  // ... существующие зависимости ...
  longitudinalForces,
  speedCurvePoints,
  speedLimits,
];

// ============================================================================
// ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ ПАТЧА
// ============================================================================

/*
1. Скопировать файл regime-map-data.ts в папку с компонентами
2. Скопировать туда же файлы с данными:
   - speed-limits-precise.ts
   - longitudinal-forces-correct.ts
   - speed-curves.ts

3. В ChartEditor.tsx:
   - Добавить импорты (раздел 1)
   - Заменить код отрисовки LAYER 1 (раздел 2)
   - Заменить код отрисовки кривых в LAYER 2 (раздел 3)
   - Обновить зависимости useCallback (раздел 4)

4. Проверить:
   - Кривые продольных сил отображаются в верхнем блоке
   - Три кривые скорости отображаются во втором блоке
   - Ограничения скорости (красная линия) корректны
*/
