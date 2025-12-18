// ============================================================================
// БАЗОВЫЕ ТИПЫ И МЕТАДАННЫЕ
// ============================================================================

/**
 * Базовый тип для всех сущностей с метаданными проекта
 */
export type EntityMetadata = {
  id: number | string;
  createdAt: string; // ISO 8601 формат
  updatedAt: string; // ISO 8601 формат
  createdBy: string; // ID или имя пользователя
  updatedBy: string; // ID или имя пользователя
  version: number; // Версия для отслеживания изменений
  projectName?: string;
  projectId?: number;
};

/**
 * Источник данных - откуда импортированы данные
 */
export type DataSource = 'MANUAL' | 'IMPORTED' | 'CALCULATED' | 'EXTERNAL_SYSTEM';

// ============================================================================
// УЧАСТОК (TRACK SECTION)
// ============================================================================

/**
 * Станция на участке
 */
export type Station = {
  id: number | string;
  name: string;
  /** Координата станции от начала участка, км */
  coordinate: number;
  /** Станция с петлей для разворота составов */
  loopStation: boolean;
  /** ID дороги/линии, к которой принадлежит станция */
  roadId?: number | null;
  /** ID полигона */
  polygonId?: number | null;
  /** Тип станции (промежуточная, узловая, и т.д.) */
  stationType?: 'INTERMEDIATE' | 'JUNCTION' | 'TERMINAL';
  /** Высота над уровнем моря, м (опционально) */
  elevation?: number;
};

/**
 * Элемент профиля пути
 */
export type ProfileElement = {
  /** Начальная координата элемента, км */
  startCoordinate: number;
  /** Длина элемента, км */
  length: number;
  /** Уклон, ‰ (промилле) */
  gradient: number;
  /** Радиус кривой, м (0 = прямая) */
  curveRadius: number;
  /** Длина кривой, м */
  curveLength: number;
  /** Эквивалентный уклон от кривой, ‰ */
  equivalentCurveGradient: number;
  /** Приведенное сопротивление от профиля и кривой, Н/кН */
  totalResistance: number;
};

/**
 * Ограничение скорости на участке
 */
export type SpeedLimit = {
  /** Начальная координата ограничения, км */
  startCoordinate: number;
  /** Конечная координата ограничения, км (undefined = до конца участка) */
  endCoordinate?: number;
  /** Ограничение скорости, км/ч */
  limit: number;
  /** Причина ограничения */
  reason?: string;
  /** Временное ограничение */
  temporary?: boolean;
};

/**
 * Ограничения скорости по направлениям
 */
export type DirectionalSpeedLimits = {
  forward: SpeedLimit[];
  backward: SpeedLimit[];
  /** Направление вперед недоступно */
  forwardDisabled?: boolean;
  /** Направление назад недоступно */
  backwardDisabled?: boolean;
};

/**
 * Категория пути (определяет базовые ограничения скорости)
 */
export type TrackCategory = {
  id: number | string;
  name: string;
  /** Приоритет категории (чем выше, тем приоритетнее) */
  priority: number;
  /** Ограничения скорости для категории */
  speedLimits: DirectionalSpeedLimits;
};

/**
 * Путь (single track)
 */
export type SingleTrack = {
  id: number | string;
  /** Номер пути (1, 2 и т.д.) */
  trackNumber: number;
  /** Тип пути */
  trackType: 'MAIN' | 'STATION' | 'SIDING';
  /** Станции на пути */
  stations: Station[];
  /** Профиль пути */
  profile: ProfileElement[];
  /** Категории с ограничениями */
  categories: TrackCategory[];
};

/**
 * Полный участок с метаданными
 */
export type TrackSection = EntityMetadata & {
  name: string;
  description?: string;
  /** Название дороги/линии */
  roadName: string;
  roadId?: number;
  /** Имя первой станции */
  firstStationName: string;
  /** Имя последней станции */
  lastStationName: string;
  /** Общая длина участка, км */
  totalLength: number;
  /** Координаты (возможно, географические) */
  coordinates?: string;
  /** Количество путей */
  numberOfTracks: number;
  /** Нечетное направление от первой станции */
  oddDirectionFromFirstStation: boolean;
  /** Пути на участке */
  tracks: SingleTrack[];
  /** Источник данных */
  dataSource: DataSource;
  /** Активен ли участок */
  active?: boolean;
};

// ============================================================================
// ПОДВИЖНОЙ СОСТАВ - ЛОКОМОТИВЫ
// ============================================================================

/**
 * Коэффициенты сопротивления движению
 */
export type ResistanceCoefficients = {
  /** Коэффициенты для звеньевого пути [w0, w1, w2] */
  jointedRail: number[];
  /** Коэффициенты для бесстыкового пути [w0, w1, w2] */
  continuousRail: number[];
};

/**
 * Сопротивление движению локомотива
 */
export type LocomotiveResistance = {
  /** Коэффициенты при тяге */
  motoringMode: ResistanceCoefficients;
  /** Коэффициенты при холостом ходе */
  idleMode: ResistanceCoefficients;
};

/**
 * Тип электрической характеристики
 */
export type ElectricalCharacteristicType = 'DC' | 'AC';

/**
 * Электрическая характеристика локомотива (тяговая характеристика)
 */
export type TractiveCharacteristic = {
  id?: string;
  /** Тип характеристики (постоянный/переменный ток) */
  type: ElectricalCharacteristicType;
  /** Скорость, км/ч */
  speed: number;
  /** Сила тяги, кН */
  tractiveForce: number;
  /** Ток тяговых двигателей, А */
  motorCurrent: number;
  /** Ток активный, А (для переменного тока) */
  activeCurrent?: number;
  /** Ток коммутирующий, А (для переменного тока) */
  commutateCurrent?: number;
  /** КПД, % */
  efficiency?: number;
  /** Коэффициент мощности (для переменного тока) */
  powerFactor?: number;
};

/**
 * Позиция контроллера (ступень управления)
 */
export type ControllerPosition = {
  id: string;
  /** Название позиции (П1, П2 и т.д.) */
  name: string;
  /** Характеристики для данной позиции */
  characteristics: TractiveCharacteristic[];
};

/**
 * Характеристики торможения
 */
export type BrakingCharacteristics = {
  /** Предельная характеристика торможения */
  limit: TractiveCharacteristic[];
  /** Максимальная характеристика торможения */
  max: TractiveCharacteristic[];
};

/**
 * Тепловая характеристика тягового двигателя
 */
export type MotorThermalPoint = {
  id: string;
  /** Ток двигателя, А */
  motorCurrent: number;
  /** Установившееся превышение температуры, °C */
  steadyStateOverheat: number;
  /** Постоянная времени нагрева, мин */
  thermalTimeConstant: number;
};

/**
 * Тепловые характеристики двигателя
 */
export type MotorThermalCharacteristics = {
  /** Допустимое превышение температуры, °C */
  overheatTolerance: number;
  /** Характеристики для разных токов */
  characteristics: MotorThermalPoint[];
};

/**
 * Локомотив
 */
export type Locomotive = EntityMetadata & {
  name: string;
  /** Серия локомотива (ВЛ80, 2ЭС5К и т.д.) */
  series: string;
  /** Тип тока (постоянный/переменный/двойного питания) */
  currentType: 'DC' | 'AC' | 'DUAL';
  /** Род тока для расчетов (DC/AC) */
  calculationCurrentType: 'DC' | 'AC';
  /** Тип локомотива */
  type: 'ELECTRIC' | 'DIESEL' | 'HYBRID';
  /** Мощность, кВт */
  power: number;
  /** Масса локомотива, т */
  weight: number;
  /** Длина по осям автосцепок, м */
  length: number;
  /** Конструктивная скорость, км/ч */
  maxSpeed: number;
  /** Количество осей */
  axleCount?: number;
  /** Тип тягового двигателя */
  motorType?: string;
  /** Мощность собственных нужд, кВт */
  auxiliaryPower?: number;
  /** Ток собственных нужд, А */
  auxiliaryCurrent?: number;
  /** Номинальный ток, А */
  nominalCurrent?: number;
  /** Сопротивление движению */
  resistance: LocomotiveResistance;
  /** Электрические характеристики (позиции контроллера) */
  controllerPositions: ControllerPosition[];
  /** Характеристики торможения */
  braking?: BrakingCharacteristics;
  /** Тепловые характеристики двигателей */
  thermalCharacteristics?: MotorThermalCharacteristics;
  /** Активен ли локомотив */
  active?: boolean;
};

// ============================================================================
// ПОДВИЖНОЙ СОСТАВ - ВАГОНЫ И СОСТАВЫ
// ============================================================================

/**
 * Тип тормозных колодок
 */
export type BrakeShoeType = 'CAST_IRON' | 'COMPOSITE';

/**
 * Вагон
 */
export type Car = EntityMetadata & {
  name: string;
  /** Тип вагона */
  type: 'FREIGHT' | 'PASSENGER' | 'TANK' | 'HOPPER' | 'FLATCAR' | 'BOXCAR';
  /** Количество осей */
  axleCount: number;
  /** Масса тары, т */
  emptyWeight: number;
  /** Грузоподъемность, т */
  capacity: number;
  /** Длина по осям автосцепок, м */
  length: number;
  /** Сопротивление движению */
  resistance: ResistanceCoefficients;
  /** Тип тормозных колодок */
  brakeShoeType: BrakeShoeType;
  /** Расчетное нажатие тормозных колодок на ось, кН */
  brakeForcePerAxle?: number;
  /** Активен ли вагон */
  active?: boolean;
};

/**
 * Вагон в составе с конкретным количеством
 */
export type CarInTrain = {
  car: Car;
  /** Количество вагонов данного типа */
  count: number;
  /** Масса груза на один вагон, т */
  cargoWeight: number;
};

/**
 * Состав поезда
 */
export type Train = EntityMetadata & {
  name: string;
  /** Вагоны в составе */
  cars: CarInTrain[];
  /** Общая масса состава, т (вычисляемое поле) */
  totalWeight?: number;
  /** Общая длина состава, м (вычисляемое поле) */
  totalLength?: number;
  /** Общее количество осей (вычисляемое поле) */
  totalAxles?: number;
  /** Общее сопротивление (вычисляемое поле) */
  averageResistance?: ResistanceCoefficients;
  /** Мощность подвагонных генераторов, кВт */
  auxiliaryGeneratorPower?: number;
  /** Общее расчетное нажатие тормозных колодок, кН (вычисляемое) */
  totalBrakeForce?: number;
  /** Активен ли состав */
  active?: boolean;
};

// ============================================================================
// КОНФИГУРАЦИЯ РАСЧЕТА
// ============================================================================

/**
 * Пользовательское ограничение скорости
 */
export type CustomSpeedLimit = {
  id: string;
  /** Начальная координата, км */
  startCoordinate: number;
  /** Конечная координата, км */
  endCoordinate: number;
  /** Ограничение скорости, км/ч */
  limit: number;
  /** Комментарий */
  comment?: string;
};

/**
 * Тип объекта на карте
 */
export type MapObjectType = 
  | 'BRAKE_TEST_POINT'      // Точка опробования тормозов
  | 'PICKET'                // Пикет
  | 'NEUTRAL_SECTION_START' // Начало нейтральной вставки
  | 'NEUTRAL_SECTION_END'   // Конец нейтральной вставки
  | 'WATER_INTAKE'          // Водозаборная колонка
  | 'SIGNAL'                // Светофор
  | 'SWITCH'                // Стрелочный перевод
  | 'CROSSING'              // Переезд
  | 'TUNNEL_START'          // Начало тоннеля
  | 'TUNNEL_END'            // Конец тоннеля
  | 'BRIDGE_START'          // Начало моста
  | 'BRIDGE_END';           // Конец моста

/**
 * Объект на карте
 */
export type MapObject = {
  id: string;
  type: MapObjectType;
  /** Координата объекта, км */
  coordinate: number;
  /** Название/описание */
  label?: string;
  /** Дополнительные параметры */
  properties?: Record<string, any>;
};

/**
 * Направление движения
 */
export type Direction = 'FORWARD' | 'BACKWARD';

/**
 * Режим ведения (тяги)
 */
export type TractionMode = 
  | 'ACCELERATION'  // Разгон
  | 'COASTING'      // Выбег
  | 'BRAKING'       // Торможение
  | 'CONSTANT_SPEED'; // Постоянная скорость

/**
 * Конфигурация расчета режимной карты
 */
export type RegimeMapConfiguration = EntityMetadata & {
  name: string;
  description?: string;
  /** Участок */
  trackSection: TrackSection;
  /** Локомотив */
  locomotive: Locomotive;
  /** Состав */
  train: Train;
  /** Направление движения */
  direction: Direction;
  /** Начальная станция (ID) */
  startStationId: number | string;
  /** Конечная станция (ID) */
  endStationId: number | string;
  /** Пользовательские ограничения скорости */
  customSpeedLimits: CustomSpeedLimit[];
  /** Объекты на карте */
  mapObjects: MapObject[];
  /** Тип рельсов для расчета сопротивления */
  railType: 'JOINTED' | 'CONTINUOUS';
  /** Начальная скорость, км/ч */
  initialSpeed?: number;
  /** Конечная скорость, км/ч */
  finalSpeed?: number;
  /** Учитывать рекуперацию при торможении */
  useRegeneration?: boolean;
  /** Температура окружающей среды, °C */
  ambientTemperature?: number;
};

// ============================================================================
// РЕЗУЛЬТАТЫ РАСЧЕТА
// ============================================================================

/**
 * Точка расчета скорости
 */
export type SpeedPoint = {
  /** Координата, км */
  distance: number;
  /** Скорость, км/ч */
  velocity: number;
  /** Время от начала движения, с */
  time: number;
  /** Затраченная энергия, кВт·ч */
  energy: number;
  /** Режим ведения в данной точке */
  mode?: TractionMode;
  /** Позиция контроллера */
  controllerPosition?: string;
};

/**
 * Точка расчета продольных сил
 */
export type LongitudinalForcePoint = {
  /** Координата, км */
  distance: number;
  /** Скорость, км/ч */
  velocity: number;
  /** Время от начала движения, с */
  time: number;
  /** Сила растяжения, кН (положительная) */
  tensionForce: number;
  /** Сила сжатия, кН (положительная, или 0 если нет сжатия) */
  compressionForce: number;
  /** Максимальная допустимая сила, кН */
  maxAllowableForce?: number;
};

/**
 * Участок с одним режимом ведения
 */
export type RegimeSegment = {
  /** Начальная координата, км */
  startDistance: number;
  /** Конечная координата, км */
  endDistance: number;
  /** Режим ведения */
  mode: TractionMode;
  /** Позиция контроллера (для режима тяги) */
  controllerPosition?: string;
  /** Средняя скорость на участке, км/ч */
  averageSpeed?: number;
};

/**
 * Остановка на станции
 */
export type StationStop = {
  /** Станция */
  station: Station;
  /** Время прибытия от начала движения, с */
  arrivalTime: number;
  /** Время отправления от начала движения, с */
  departureTime: number;
  /** Время стоянки, с */
  stopDuration: number;
  /** Координата станции, км */
  distance: number;
};

/**
 * Запись в расписании между двумя станциями
 */
export type ScheduleSegment = {
  /** Начальная станция */
  fromStation: Station;
  /** Конечная станция */
  toStation: Station;
  /** Расстояние от начальной станции маршрута, км */
  distanceFromStart: number;
  /** Расстояние между станциями, км */
  segmentDistance: number;
  /** Время в пути между станциями, мин */
  travelTime: number;
  /** Время стоянки на конечной станции сегмента, мин */
  stopTime: number;
  /** Суммарное время от начала маршрута, мин */
  totalTime: number;
};

/**
 * Полное расписание движения
 */
export type TrainSchedule = {
  /** Записи расписания */
  segments: ScheduleSegment[];
  /** Общее расстояние, км */
  totalDistance: number;
  /** Общее время в пути (чистое), мин */
  totalTravelTime: number;
  /** Общее время стоянок, мин */
  totalStopTime: number;
  /** Общее время (с остановками), мин */
  totalTime: number;
  /** Средняя скорость (техническая, без остановок), км/ч */
  averageSpeed: number;
  /** Средняя скорость (участковая, с остановками), км/ч */
  averageSpeedWithStops: number;
};

/**
 * Результаты расчета режимной карты
 */
export type RegimeMapResult = EntityMetadata & {
  /** Конфигурация, для которой выполнен расчет */
  configuration: RegimeMapConfiguration;
  /** Кривая скорости */
  speedCurve: SpeedPoint[];
  /** Продольные силы */
  longitudinalForces: LongitudinalForcePoint[];
  /** Ленты режимов */
  regimeSegments: RegimeSegment[];
  /** Остановки на станциях */
  stationStops: StationStop[];
  /** Расписание движения */
  schedule: TrainSchedule;
  /** Общая затраченная энергия, кВт·ч */
  totalEnergy: number;
  /** Максимальная скорость, км/ч */
  maxSpeed: number;
  /** Проверка на безопасность пройдена */
  safetyCheckPassed: boolean;
  /** Предупреждения и замечания */
  warnings?: string[];
  /** Статус расчета */
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  /** Сообщение об ошибке (если есть) */
  errorMessage?: string;
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ ДЛЯ API
// ============================================================================

/**
 * Запрос на расчет режимной карты
 */
export type CalculateRegimeMapRequest = {
  configuration: RegimeMapConfiguration;
  /** Параметры расчета */
  calculationParams?: {
    /** Шаг интегрирования, км */
    integrationStep?: number;
    /** Точность расчета */
    accuracy?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
};

/**
 * Ответ с результатом расчета
 */
export type CalculateRegimeMapResponse = {
  success: boolean;
  result?: RegimeMapResult;
  error?: string;
};
