// ============================================================================
// ТИПЫ ДЛЯ ОТРИСОВКИ РЕЖИМНОЙ КАРТЫ НА КЛИЕНТЕ
// ============================================================================

/**
 * Координаты и границы карты
 */
export type MapBounds = {
  /** Начальная координата участка, км */
  startDistance: number;
  /** Конечная координата участка, км */
  endDistance: number;
  /** Минимальная скорость для масштабирования оси Y, км/ч */
  minSpeed: number;
  /** Максимальная скорость для масштабирования оси Y, км/ч */
  maxSpeed: number;
  /** Минимальный уклон, ‰ */
  minGradient: number;
  /** Максимальный уклон, ‰ */
  maxGradient: number;
};

/**
 * Элемент профиля пути для отрисовки
 */
export type ProfileSegment = {
  /** Начальная координата, км */
  start: number;
  /** Конечная координата, км */
  end: number;
  /** Уклон, ‰ (положительный = подъем, отрицательный = спуск) */
  gradient: number;
  /** Радиус кривой, м (0 = прямая) */
  curveRadius: number;
  /** Есть ли кривая на этом участке */
  hasCurve: boolean;
};

/**
 * Станция для отметки на карте
 */
export type StationMarker = {
  /** Название станции */
  name: string;
  /** Координата станции, км */
  distance: number;
  /** Станция с петлей (для визуального обозначения) */
  isLoop: boolean;
  /** Тип станции для визуализации */
  type: 'start' | 'end' | 'intermediate';
};

/**
 * Ограничение скорости для отрисовки
 */
export type SpeedLimitSegment = {
  /** Начальная координата, км */
  start: number;
  /** Конечная координата, км */
  end: number;
  /** Ограничение скорости, км/ч */
  limit: number;
  /** Тип ограничения для визуализации */
  type: 'track_category' | 'custom' | 'temporary';
  /** Причина ограничения (для tooltip) */
  reason?: string;
};

/**
 * Точка кривой скорости
 */
export type SpeedCurvePoint = {
  /** Координата, км */
  distance: number;
  /** Скорость, км/ч */
  speed: number;
  /** Время от начала движения, мин */
  time: number;
};

/**
 * Участок с единым режимом управления
 */
export type RegimeBand = {
  /** Начальная координата, км */
  start: number;
  /** Конечная координата, км */
  end: number;
  /** Режим ведения */
  mode: 'acceleration' | 'coasting' | 'braking' | 'constant_speed';
  /** Позиция контроллера (для режима тяги) */
  controllerPosition?: string;
};

/**
 * Точка графика продольных сил
 */
export type LongitudinalForcePoint = {
  /** Координата, км */
  distance: number;
  /** Сила растяжения, кН (всегда >= 0) */
  tension: number;
  /** Сила сжатия, кН (всегда >= 0) */
  compression: number;
  /** Максимально допустимая сила, кН */
  maxAllowable?: number;
};

/**
 * Объект инфраструктуры на карте
 */
export type InfrastructureObject = {
  /** Тип объекта */
  type: 
    | 'brake_test'           // Точка опробования тормозов
    | 'picket'               // Пикет
    | 'neutral_start'        // Начало нейтральной вставки
    | 'neutral_end'          // Конец нейтральной вставки
    | 'water_intake'         // Водозаборная колонка
    | 'signal'               // Светофор
    | 'switch'               // Стрелочный перевод
    | 'crossing'             // Переезд
    | 'tunnel_start'         // Начало тоннеля
    | 'tunnel_end'           // Конец тоннеля
    | 'bridge_start'         // Начало моста
    | 'bridge_end';          // Конец моста
  /** Координата, км */
  distance: number;
  /** Подпись для отображения */
  label?: string;
};

/**
 * Метаинформация о расчете
 */
export type CalculationMetadata = {
  /** ID конфигурации расчета */
  configurationId: string;
  /** Название конфигурации */
  configurationName: string;
  /** Дата и время расчета */
  calculatedAt: string;
  /** Направление движения */
  direction: 'forward' | 'backward';
  /** Локомотив */
  locomotive: {
    name: string;
    series: string;
    weight: number; // тонн
    power: number;  // кВт
  };
  /** Состав */
  train: {
    name: string;
    weight: number; // тонн
    length: number; // метров
    numberOfCars: number;
  };
  /** Общие результаты */
  totals: {
    /** Общее расстояние, км */
    distance: number;
    /** Общее время в пути, мин */
    travelTime: number;
    /** Затраченная энергия, кВт·ч */
    energy: number;
    /** Средняя скорость, км/ч */
    averageSpeed: number;
    /** Максимальная скорость, км/ч */
    maxSpeed: number;
  };
  /** Статус безопасности */
  safety: {
    passed: boolean;
    warnings: string[];
  };
};

/**
 * ГЛАВНЫЙ ТИП - Полные данные для отрисовки режимной карты
 */
export type RegimeMapRenderData = {
  /** Метаинформация */
  metadata: CalculationMetadata;
  
  /** Границы и масштабирование карты */
  bounds: MapBounds;
  
  /** Профиль пути (уклоны и кривые) */
  profile: ProfileSegment[];
  
  /** Станции для отметок */
  stations: StationMarker[];
  
  /** Ограничения скорости */
  speedLimits: SpeedLimitSegment[];
  
  /** Кривая скорости */
  speedCurve: SpeedCurvePoint[];
  
  /** Ленты режимов управления */
  regimeBands: RegimeBand[];
  
  /** График продольных сил */
  longitudinalForces: LongitudinalForcePoint[];
  
  /** Объекты инфраструктуры */
  infrastructure: InfrastructureObject[];
};

// ============================================================================
// ПРИМЕР JSON
// ============================================================================

/**
 * Пример JSON для отрисовки режимной карты
 */
export const exampleRegimeMapData: RegimeMapRenderData = {
  metadata: {
    configurationId: "cfg_12345",
    configurationName: "Москва - Санкт-Петербург, ВЛ80 + грузовой состав",
    calculatedAt: "2024-12-18T10:30:00Z",
    direction: "forward",
    locomotive: {
      name: "ВЛ80С-1234",
      series: "ВЛ80С",
      weight: 184,
      power: 6520
    },
    train: {
      name: "Грузовой состав 71 вагон",
      weight: 5100,
      length: 1050,
      numberOfCars: 71
    },
    totals: {
      distance: 650.5,
      travelTime: 485,
      energy: 12450,
      averageSpeed: 80.5,
      maxSpeed: 90
    },
    safety: {
      passed: true,
      warnings: [
        "Приближение к максимальной силе растяжения на км 125.3"
      ]
    }
  },
  
  bounds: {
    startDistance: 0,
    endDistance: 650.5,
    minSpeed: 0,
    maxSpeed: 100,
    minGradient: -12,
    maxGradient: 15
  },
  
  profile: [
    {
      start: 0,
      end: 5.2,
      gradient: 0,
      curveRadius: 0,
      hasCurve: false
    },
    {
      start: 5.2,
      end: 8.7,
      gradient: 8.5,
      curveRadius: 600,
      hasCurve: true
    },
    {
      start: 8.7,
      end: 15.0,
      gradient: -3.2,
      curveRadius: 0,
      hasCurve: false
    }
    // ... остальные элементы профиля
  ],
  
  stations: [
    {
      name: "Москва-Товарная",
      distance: 0,
      isLoop: false,
      type: "start"
    },
    {
      name: "Химки",
      distance: 18.5,
      isLoop: false,
      type: "intermediate"
    },
    {
      name: "Санкт-Петербург-Товарный",
      distance: 650.5,
      isLoop: true,
      type: "end"
    }
  ],
  
  speedLimits: [
    {
      start: 0,
      end: 15.0,
      limit: 60,
      type: "track_category",
      reason: "Участок 4 категории"
    },
    {
      start: 15.0,
      end: 35.8,
      limit: 80,
      type: "track_category"
    },
    {
      start: 25.0,
      end: 27.5,
      limit: 40,
      type: "temporary",
      reason: "Ремонт пути"
    }
    // ... остальные ограничения
  ],
  
  speedCurve: [
    { distance: 0, speed: 0, time: 0 },
    { distance: 0.5, speed: 25.3, time: 0.71 },
    { distance: 1.0, speed: 35.8, time: 1.25 },
    { distance: 1.5, speed: 43.2, time: 1.71 },
    { distance: 2.0, speed: 49.5, time: 2.12 }
    // ... сотни или тысячи точек
  ],
  
  regimeBands: [
    {
      start: 0,
      end: 12.5,
      mode: "acceleration",
      controllerPosition: "П3"
    },
    {
      start: 12.5,
      end: 18.3,
      mode: "constant_speed",
      controllerPosition: "П2"
    },
    {
      start: 18.3,
      end: 22.1,
      mode: "coasting"
    },
    {
      start: 22.1,
      end: 25.0,
      mode: "braking"
    }
    // ... остальные участки
  ],
  
  longitudinalForces: [
    {
      distance: 0,
      tension: 0,
      compression: 0,
      maxAllowable: 1200
    },
    {
      distance: 5.0,
      tension: 850,
      compression: 0,
      maxAllowable: 1200
    },
    {
      distance: 10.0,
      tension: 1050,
      compression: 0,
      maxAllowable: 1200
    },
    {
      distance: 15.0,
      tension: 0,
      compression: 420,
      maxAllowable: 1200
    }
    // ... сотни точек
  ],
  
  infrastructure: [
    {
      type: "brake_test",
      distance: 2.5,
      label: "Точка опробования тормозов"
    },
    {
      type: "neutral_start",
      distance: 45.2,
      label: "Начало НВ"
    },
    {
      type: "neutral_end",
      distance: 45.8,
      label: "Конец НВ"
    },
    {
      type: "picket",
      distance: 100.0,
      label: "ПК 100"
    },
    {
      type: "tunnel_start",
      distance: 123.5,
      label: "Тоннель"
    },
    {
      type: "tunnel_end",
      distance: 125.8
    }
    // ... остальные объекты
  ]
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРЕОБРАЗОВАНИЯ
// ============================================================================

/**
 * Преобразование полного результата расчета в формат для отрисовки
 * (эта функция должна быть на бекенде перед отправкой данных клиенту)
 */
export function convertToRenderData(
  result: any // RegimeMapResult из полной системы типов
): RegimeMapRenderData {
  return {
    metadata: {
      configurationId: result.configuration.id,
      configurationName: result.configuration.name,
      calculatedAt: result.createdAt,
      direction: result.configuration.direction === 'FORWARD' ? 'forward' : 'backward',
      locomotive: {
        name: result.configuration.locomotive.name,
        series: result.configuration.locomotive.series,
        weight: result.configuration.locomotive.weight,
        power: result.configuration.locomotive.power
      },
      train: {
        name: result.configuration.train.name,
        weight: result.configuration.train.totalWeight || 0,
        length: result.configuration.train.totalLength || 0,
        numberOfCars: result.configuration.train.cars.reduce((sum, c) => sum + c.count, 0)
      },
      totals: {
        distance: result.configuration.trackSection.totalLength,
        travelTime: result.schedule.totalTravelTime,
        energy: result.totalEnergy,
        averageSpeed: result.schedule.averageSpeed,
        maxSpeed: result.maxSpeed
      },
      safety: {
        passed: result.safetyCheckPassed,
        warnings: result.warnings || []
      }
    },
    
    bounds: calculateBounds(result),
    
    profile: convertProfile(result.configuration.trackSection.tracks[0].profile),
    
    stations: convertStations(
      result.configuration.trackSection.tracks[0].stations,
      result.configuration.startStationId,
      result.configuration.endStationId
    ),
    
    speedLimits: convertSpeedLimits(
      result.configuration.trackSection.tracks[0].categories,
      result.configuration.customSpeedLimits
    ),
    
    speedCurve: result.speedCurve.map((p: any) => ({
      distance: p.distance,
      speed: p.velocity,
      time: p.time / 60 // конвертируем секунды в минуты
    })),
    
    regimeBands: result.regimeSegments.map((s: any) => ({
      start: s.startDistance,
      end: s.endDistance,
      mode: s.mode.toLowerCase(),
      controllerPosition: s.controllerPosition
    })),
    
    longitudinalForces: result.longitudinalForces.map((f: any) => ({
      distance: f.distance,
      tension: f.tensionForce,
      compression: f.compressionForce,
      maxAllowable: f.maxAllowableForce
    })),
    
    infrastructure: result.configuration.mapObjects.map((obj: any) => ({
      type: convertObjectType(obj.type),
      distance: obj.coordinate,
      label: obj.label
    }))
  };
}

function calculateBounds(result: any): MapBounds {
  const speedPoints = result.speedCurve;
  const profile = result.configuration.trackSection.tracks[0].profile;
  
  return {
    startDistance: 0,
    endDistance: result.configuration.trackSection.totalLength,
    minSpeed: 0,
    maxSpeed: Math.ceil(Math.max(...speedPoints.map((p: any) => p.velocity)) / 10) * 10,
    minGradient: Math.min(...profile.map((p: any) => p.gradient)),
    maxGradient: Math.max(...profile.map((p: any) => p.gradient))
  };
}

function convertProfile(profile: any[]): ProfileSegment[] {
  return profile.map(p => ({
    start: p.startCoordinate,
    end: p.startCoordinate + p.length,
    gradient: p.gradient,
    curveRadius: p.curveRadius,
    hasCurve: p.curveRadius > 0
  }));
}

function convertStations(
  stations: any[],
  startId: string | number,
  endId: string | number
): StationMarker[] {
  return stations.map(s => ({
    name: s.name,
    distance: s.coordinate,
    isLoop: s.loopStation,
    type: s.id === startId ? 'start' : s.id === endId ? 'end' : 'intermediate'
  }));
}

function convertSpeedLimits(
  categories: any[],
  customLimits: any[]
): SpeedLimitSegment[] {
  const result: SpeedLimitSegment[] = [];
  
  // Добавляем ограничения из категорий
  categories.forEach(cat => {
    cat.speedLimits.forward.forEach((limit: any) => {
      result.push({
        start: limit.startCoordinate,
        end: limit.endCoordinate || Infinity,
        limit: limit.limit,
        type: limit.temporary ? 'temporary' : 'track_category',
        reason: limit.reason
      });
    });
  });
  
  // Добавляем пользовательские ограничения
  customLimits.forEach(limit => {
    result.push({
      start: limit.startCoordinate,
      end: limit.endCoordinate,
      limit: limit.limit,
      type: 'custom',
      reason: limit.comment
    });
  });
  
  return result;
}

function convertObjectType(type: string): InfrastructureObject['type'] {
  const mapping: Record<string, InfrastructureObject['type']> = {
    'BRAKE_TEST_POINT': 'brake_test',
    'PICKET': 'picket',
    'NEUTRAL_SECTION_START': 'neutral_start',
    'NEUTRAL_SECTION_END': 'neutral_end',
    'WATER_INTAKE': 'water_intake',
    'SIGNAL': 'signal',
    'SWITCH': 'switch',
    'CROSSING': 'crossing',
    'TUNNEL_START': 'tunnel_start',
    'TUNNEL_END': 'tunnel_end',
    'BRIDGE_START': 'bridge_start',
    'BRIDGE_END': 'bridge_end'
  };
  
  return mapping[type] || 'picket';
}
