// Visio-like Object Palette for Regime Chart Editing
// Палитра объектов для редактирования режимных карт ведения поездов
// Provides categorized draggable objects for creating locomotive regime charts

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Zap,
  Power,
  Circle,
  MapPin,
  Activity,
  Move,
  ArrowRight,
  Gauge,
  Route,
  AlertTriangle,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { LOCOMOTIVES } from "../types/consts";

// Object definition type
export interface PaletteObject {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
}

// Category definition
interface ObjectCategory {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  objects: PaletteObject[];
}

// Traction mode from locomotive data
interface TractionMode {
  id: string;
  label: string;
  lineStyle: "solid" | "dashed" | "dotted";
  color: string;
}

// Locomotive data structure
interface Locomotive {
  id: string;
  name: string;
  length: number;
  mass: number;
  tractionModes: TractionMode[];
}

// =============================================================================
// СТАТИЧЕСКИЕ КАТЕГОРИИ ОБЪЕКТОВ
// Static object categories for regime charts
// =============================================================================

const staticObjectCategories: ObjectCategory[] = [
  // -------------------------------------------------------------------------
  // КРИВАЯ ХОДА ПОЕЗДА И СКОРОСТЬ
  // Train movement curve and speed elements
  // -------------------------------------------------------------------------
  {
    id: "speed-curve",
    name: "Speed & Movement",
    nameRu: "Кривая скорости и ограничения",
    icon: <Activity className="size-4" />,
    objects: [
      {
        id: "train-movement-curve",
        name: "Train Movement Curve",
        nameRu: "Кривая скорости",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            <path
              d="M2 16 Q 6 4, 10 10 Q 14 16, 18 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        category: "speed-curve",
        description: "Линия изменения скорости по пути следования",
      },
      {
        id: "speed-limit-permanent",
        name: "Permanent Speed Limit",
        nameRu: "Ограничение скорости (постоянное)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="14" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
          </svg>
        ),
        category: "speed-curve",
        description: "Ограничение скорости (постоянное)",
      },
      {
        id: "speed-limit-temporary",
        name: "Temporary Speed Limit",
        nameRu: "Ограничение скорости (временное)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-600">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
            <text x="10" y="14" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
          </svg>
        ),
        category: "speed-curve",
        description: "Временное ограничение скорости (предупреждение)",
      },
      {
        id: "permitted-speed",
        name: "Permitted Speed Line",
        nameRu: "Максимально допустимая скорость",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4,2" />
          </svg>
        ),
        category: "speed-curve",
        description: "Линия максимально допускаемой скорости",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // РЕЖИМЫ УПРАВЛЕНИЯ ПОЕЗДОМ
  // Train control modes (braking, coasting)
  // -------------------------------------------------------------------------
  {
    id: "control-modes",
    name: "Control Modes",
    nameRu: "Режимы управления поездом",
    icon: <Power className="size-4" />,
    objects: [
      {
        id: "coasting",
        name: "Coasting",
        nameRu: "Выбег",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500">
            <path
              d="M2 10 L18 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <text x="10" y="7" fontSize="6" fill="currentColor" textAnchor="middle">
              ВЫБ
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Движение без тяги и торможения",
      },
      {
        id: "pneumatic-braking",
        name: "Pneumatic Braking",
        nameRu: "Пневматическое торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-600">
            <rect x="3" y="6" width="14" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="13" fontSize="7" fill="currentColor" textAnchor="middle" fontWeight="bold">
              Т
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Служебное пневматическое торможение",
      },
      /*{
        id: "regenerative-braking",
        name: "Regenerative Braking",
        nameRu: "Рекуперативное торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <path d="M2 14 Q 10 6, 18 14" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15 11 L18 14 L15 17" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="5" cy="12" r="2" fill="currentColor" />
          </svg>
        ),
        category: "control-modes",
        description: "Торможение с возвратом энергии в сеть",
      },
      {
        id: "rheostatic-braking",
        name: "Rheostatic Braking",
        nameRu: "Реостатное торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-500">
            <path d="M2 10 L4 7 L6 13 L8 7 L10 13 L12 7 L14 13 L16 7 L18 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "control-modes",
        description: "Электрическое торможение на реостаты",
      },*/
      {
        id: "electric-braking",
        name: "Electric Braking",
        nameRu: "Электрическое торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-500">
            <path d="M2 10 L4 7 L6 13 L8 7 L10 13 L12 7 L14 13 L16 7 L18 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "control-modes",
        description: "Электрическое торможение",
      },
      {
        id: "emergency-braking",
        name: "Emergency Braking",
        nameRu: "Экстренное торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <polygon points="10,2 18,18 2,18" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="15" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              !
            </text>
          </svg>
        ),
        category: "control-modes",
        description: "Экстренная остановка поезда",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ПРОДОЛЬНЫЙ ПРОФИЛЬ ПУТИ
  // Track longitudinal profile elements
  // -------------------------------------------------------------------------
  /*{
    id: "track-profile",
    name: "Track Profile",
    nameRu: "План и профиль пути",
    icon: <TrendingUp className="size-4" />,
    objects: [
      {
        id: "ascending-grade",
        name: "Ascending Grade",
        nameRu: "Подъём",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <path d="M2 16 L18 4" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="8" fontSize="6" fill="currentColor" textAnchor="middle">
              ‰+
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Участок подъёма (уклон вверх)",
      },
      {
        id: "descending-grade",
        name: "Descending Grade",
        nameRu: "Спуск",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <path d="M2 4 L18 16" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="8" fontSize="6" fill="currentColor" textAnchor="middle">
              ‰−
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Участок спуска (уклон вниз)",
      },
      {
        id: "level-section",
        name: "Level Section",
        nameRu: "Площадка",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-600">
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="7" fontSize="6" fill="currentColor" textAnchor="middle">
              0‰
            </text>
          </svg>
        ),
        category: "track-profile",
        description: "Горизонтальный участок пути",
      },
      {
        id: "grade-break-point",
        name: "Grade Break Point",
        nameRu: "Точка перелома профиля",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-600">
            <path d="M2 14 L10 6 L18 14" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="6" r="2" fill="currentColor" />
          </svg>
        ),
        category: "track-profile",
        description: "Точка изменения уклона",
      },
    ],
  },*/

  // -------------------------------------------------------------------------
  // РАЗДЕЛЬНЫЕ ПУНКТЫ И ПУТЕВЫЕ ОБЪЕКТЫ
  // Separation points and track objects
  // -------------------------------------------------------------------------
  {
    id: "track-objects",
    name: "Track Objects",
    nameRu: "Раздельные пункты и объекты",
    icon: <MapPin className="size-4" />,
    objects: [
      {
        id: "station",
        name: "Station",
        nameRu: "Станция",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-indigo-600">
            <rect x="3" y="8" width="14" height="6" fill="currentColor" />
            <rect x="6" y="4" width="8" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
            <text x="10" y="13" fontSize="5" fill="white" textAnchor="middle">
              СТ
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Железнодорожная станция",
      },
      {
        id: "passing-loop",
        name: "Passing Loop",
        nameRu: "Разъезд",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
            <path d="M6 10 Q 10 6, 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="10" y="17" fontSize="5" fill="currentColor" textAnchor="middle">
              РЗД
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Разъезд (раздельный пункт)",
      },
      /*{
        id: "block-post",
        name: "Block Post",
        nameRu: "Блок-пост",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            <rect x="8" y="4" width="4" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="8" r="2" fill="currentColor" />
          </svg>
        ),
        category: "track-objects",
        description: "Блок-пост (граница блок-участка)",
      },
      {
        id: "kilometer-post",
        name: "Kilometer Post",
        nameRu: "Километровый столб",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            <rect x="7" y="4" width="6" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="10" y="12" fontSize="6" fill="currentColor" textAnchor="middle">
              км
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Километровая отметка",
      },
      {
        id: "picket-post",
        name: "Picket Post",
        nameRu: "Пикет",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500">
            <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="6" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        category: "track-objects",
        description: "Пикетная отметка (100 м)",
      },*/
      {
        id: "level-crossing-guarded",
        name: "Guarded Level Crossing",
        nameRu: "Переезд с ограждением",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            {/* Крест - символ переезда */}
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" />
            {/* Круг - ограждение */}
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Шлагбаум */}
            <line x1="3" y1="18" x2="17" y2="18" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="17" x2="4" y2="19" stroke="currentColor" strokeWidth="1" />
            <line x1="16" y1="17" x2="16" y2="19" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        category: "track-objects", // Изменили с "structures"
        description: "Переезд с ограждением",
      },
      {
        id: "level-crossing-unguarded",
        name: "Unguarded Level Crossing",
        nameRu: "Переезд без ограждения",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-600">
            {/* Крест - символ переезда */}
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" />
            {/* Треугольник (предупреждающий знак) */}
            <path d="M10 3 L15 10 L5 10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Точки внутри треугольника */}
            <circle cx="10" cy="7" r="0.8" fill="currentColor" />
            <circle cx="8" cy="8.5" r="0.8" fill="currentColor" />
            <circle cx="12" cy="8.5" r="0.8" fill="currentColor" />
          </svg>
        ),
        category: "track-objects", // Изменили с "structures"
        description: "Неохраняемый железнодорожный переезд",
      },
      {
        id: "platform",
        name: "Platform",
        nameRu: "Платформа",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            {/* Основание платформы */}
            <rect x="3" y="10" width="14" height="4" fill="currentColor" />
            {/* Навес/крыша */}
            <line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="8" x2="4" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="16" y1="8" x2="16" y2="10" stroke="currentColor" strokeWidth="1" />
            {/* Обозначение */}
            <text x="10" y="16" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">
              ПЛ
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Пассажирская платформа",
      },
      {
        id: "ktsm",
        name: "KTSM",
        nameRu: "КТСМ, ПОНАБ",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
            {/* Здание/пост */}
            <rect x="6" y="6" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Антенна/вышка */}
            <line x1="10" y1="2" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1" />
            {/* Аббревиатура */}
            <text x="10" y="13" fontSize="3.5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              КТСМ
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Контрольно-телеграфная станция магистральной связи",
      },
      {
        id: "uksps",
        name: "UKSPS",
        nameRu: "УКСПС",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-700">
            {/* Здание с антенной */}
            <rect x="7" y="8" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Антенна (три линии) */}
            <line x1="10" y1="4" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="0.8" />
            {/* Аббревиатура */}
            <text x="10" y="15" fontSize="3" fill="currentColor" textAnchor="middle" fontWeight="bold">
              УКСПС
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Устройство контроля схода подвижного состава",
      },
      {
        id: "pedestrian-bridge",
        name: "Pedestrian Bridge",
        nameRu: "Пешеходный мост",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-800">
            {/* Опоры моста */}
            <line x1="6" y1="12" x2="6" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="14" y1="12" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
            {/* Настил моста */}
            <line x1="4" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="3" />
            {/* Перила */}
            <line x1="4" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" />
            <line x1="5" y1="9" x2="5" y2="12" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="9" x2="15" y2="12" stroke="currentColor" strokeWidth="1" />
            {/* Человечек */}
            <circle cx="10" cy="6" r="1.5" fill="currentColor" />
            <line x1="10" y1="7.5" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        category: "structures",
        description: "Пешеходный мост через пути",
      },
      {
        id: "train-join-split",
        name: "Train Join/Split Point",
        nameRu: "Место соединения-разъединения поездов (МСРП)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-purple-600">
            {/* Стрелка разветвления */}
            <line x1="4" y1="10" x2="10" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="10" x2="10" y2="15" stroke="currentColor" strokeWidth="2" />
            {/* Поезда */}
            <rect x="10" y="3" width="6" height="4" rx="1" fill="currentColor" />
            <rect x="10" y="13" width="6" height="4" rx="1" fill="currentColor" />
            {/* Обозначение */}
            <text x="5" y="18" fontSize="4" fill="currentColor" textAnchor="middle">
              МСРП
            </text>
          </svg>
        ),
        category: "track-objects",
        description: "Место для соединения или разъединения составов",
      },
      {
        id: "braking-start",
        name: "Braking Start",
        nameRu: "Начало торможения (НТ)",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            {/* Стрелка направления торможения */}
            <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" />
            {/* Штриховка/тормозной путь */}
            <line x1="8" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="7" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" />
            {/* Обозначение НТ */}
            <text x="10" y="18" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НТ
            </text>
            {/* Треугольник-указатель */}
            <path d="M16 10 L13 8 L13 12 Z" fill="currentColor" />
          </svg>
        ),
        category: "track-objects",
        description: "Точка начала торможения перед станцией или сигналом",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ИСКУССТВЕННЫЕ СООРУЖЕНИЯ
  // Engineering structures
  // -------------------------------------------------------------------------
  {
    id: "structures",
    name: "Structures",
    nameRu: "Искусственные сооружения",
    icon: <Route className="size-4" />,
    objects: [
      {
        id: "tunnel",
        name: "Tunnel",
        nameRu: "Тоннель",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-800">
            <path
              d="M2 18 L2 8 Q 2 2, 10 2 Q 18 2, 18 8 L18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "structures",
        description: "Тоннель",
      },
      {
        id: "bridge",
        name: "Bridge",
        nameRu: "Мост",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-amber-700">
            <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="2" />
            <line x1="5" y1="8" x2="5" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="8" x2="15" y2="16" stroke="currentColor" strokeWidth="2" />
            <path d="M2 8 Q 10 4, 18 8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        category: "structures",
        description: "Мост",
      },
      {
        id: "overpass",
        name: "Overpass",
        nameRu: "Путепровод",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            {/* Дорога над путями */}
            <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="2.5" />
            {/* Опоры путепровода */}
            <line x1="6" y1="6" x2="6" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="14" y1="6" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
            {/* Железнодорожные пути под путепроводом */}
            <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" />
            <line x1="3" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.5" />
            {/* Штриховка тени/подмостового пространства */}
            <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
          </svg>
        ),
        category: "structures",
        description: "Путепровод (дорога над железнодорожными путями)",
      },
      {
        id: "gallery",
        name: "Gallery",
        nameRu: "Галерея",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-amber-800">
            {/* Крыша галереи */}
            <path d="M2 5 L18 5 Q 18 2, 15 2 Q 10 0, 5 2 Q 2 2, 2 5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" />
            {/* Стены галереи */}
            <line x1="2" y1="5" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="18" y1="5" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
            {/* Основание */}
            <line x1="2" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2" />
            {/* Железнодорожный путь внутри */}
            <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1" />
            {/* Окна/отверстия в стенах */}
            <rect x="3" y="6" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="15" y="6" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </svg>
        ),
        category: "structures",
        description: "Галерея (закрытое сооружение для защиты пути)",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // УСТРОЙСТВА ЭЛЕКТРОСНАБЖЕНИЯ
  // Electric power supply devices
  // -------------------------------------------------------------------------
  {
    id: "power-supply",
    name: "Power Supply",
    nameRu: "Устройства электроснабжения",
    icon: <Zap className="size-4" />,
    objects: [
      {
        id: "neutral-insert",
        name: "Neutral Insert",
        nameRu: "Нейтральная вставка",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            {/* Прямоугольник знака */}
            <rect x="6" y="4" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Буквы НВ (вместо NI) */}
            <text x="10" y="10" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НВ
            </text>
            {/* Дополнительные элементы (если нужны) */}
            <line x1="5" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2,2" />
          </svg>
        ),
        category: "electrical",
        description: "Нейтральная вставка (участок без напряжения)",
      },
      {
        id: "power-section-boundary",
        name: "Power Section Boundary",
        nameRu: "Токораздел",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-500">
            <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
            <circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        category: "power-supply",
        description: "Токораздел",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // СИГНАЛИЗАЦИЯ
  // Signaling devices
  // -------------------------------------------------------------------------
  {
    id: "signals",
    name: "Signals",
    nameRu: "Сигналы",
    icon: <AlertTriangle className="size-4" />,
    objects: [
          {
            id: "auto-brake-test",
            name: "Auto Brake Test Point",
            nameRu: "Место проверки автотормозов",
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-black">
                {/* Квадрат */}
                <rect x="5" y="4" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                {/* Буквы НТ внутри квадрата */}
                <text x="10" y="10.5" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
                  НТ
                </text>
                {/* Отрезок вниз от середины нижней границы */}
                <line x1="10" y1="14" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ),
            category: "signals",
            description: "Место обязательной проверки автотормозов перед движением",
          },
      {
        id: "entry-signal",
        name: "Entry Signal",
        nameRu: "Входной светофор",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="2" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="2" fill="currentColor" />
          </svg>
        ),
        category: "signals",
        description: "Входной светофор станции",
      },
      {
        id: "exit-signal",
        name: "Exit Signal",
        nameRu: "Выходной светофор",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-600">
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="2" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="2" fill="currentColor" />
          </svg>
        ),
        category: "signals",
        description: "Выходной светофор станции",
      },
      {
        id: "block-signal",
        name: "Block Signal",
        nameRu: "Проходной светофор",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-500">
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="1.5" fill="currentColor" />
          </svg>
        ),
        category: "signals",
        description: "Проходной светофор автоблокировки",
      },
          {
            id: "route-signal",
            name: "Route Signal",
            nameRu: "Маршрутный светофор",
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-600">
                {/* Основание (мачта) */}
                <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
                {/* Прямоугольник щита (как у входного/выходного) */}
                <rect x="6" y="2" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                {/* Синий круг с белой стрелкой внутри - маршрутное указание */}
                <circle cx="10" cy="5" r="2" fill="currentColor" />
                <path 
                  d="M8 5 L10 7 L12 5 L10 4 Z" 
                  fill="white" 
                  stroke="white" 
                  strokeWidth="0.5"
                />
              </svg>
            ),
            category: "signals",
            description: "Маршрутный светофор для указания направления маршрута",
          },
          {
            id: "barrier-signal",
            name: "Barrier Signal",
            nameRu: "Заградительный светофор",
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-700">
                {/* Основание */}
                <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
                {/* Квадратный щит (отличие от прямоугольного) */}
                <rect x="7" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                {/* Красный крест - знак заграждения */}
                <line x1="8" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="4" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ),
            category: "signals",
            description: "Заградительный светофор для полной остановки движения",
          },
          {
            id: "repeater-signal",
            name: "Repeater Signal",
            nameRu: "Повторительный светофор",
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-yellow-600">
                {/* Основание */}
                <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
                {/* Маленький прямоугольник (меньше основного) */}
                <rect x="7" y="2.5" width="6" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                {/* Треугольник - символ повторения */}
                <path d="M8 5 L12 5 L10 7 Z" fill="currentColor" />
              </svg>
            ),
            category: "signals",
            description: "Повторительный светофор для дублирования показаний основного",
          },
          {
            id: "conditional-signal",
            name: "Conditional Signal",
            nameRu: "Условно-разрешающий сигнал",
            icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-green-700">
                {/* Основание */}
                <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
                {/* Ромбовидная форма - отличие для условных сигналов */}
                <path 
                  d="M10 2 L13 5 L10 8 L7 5 Z" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                />
                {/* Белая буква "У" внутри (Условно) */}
                <text 
                  x="10" 
                  y="6" 
                  textAnchor="middle" 
                  fontSize="4" 
                  fontWeight="bold" 
                fill="white"
              >
                У
              </text>
            </svg>
          ),
        category: "signals",
        description: "Сигнал с условно-разрешающим значением",
      },
    ],
  },
];

// =============================================================================
// ФУНКЦИЯ ГЕНЕРАЦИИ ДИНАМИЧЕСКИХ РЕЖИМОВ ТЯГИ
// Function to generate dynamic traction modes from locomotive data
// =============================================================================

const generateTractionModeObjects = (locomotive: Locomotive | null): PaletteObject[] => {
  /*if (!locomotive || !locomotive.tractionModes) {
    return [
      {
        id: "no-locomotive",
        name: "No Locomotive Selected",
        nameRu: "Локомотив не выбран",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-400">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" />
            <text x="10" y="14" fontSize="8" fill="currentColor" textAnchor="middle">
              ?
            </text>
          </svg>
        ),
        category: "traction-modes",
        description: "Выберите локомотив для отображения режимов тяги",
      },
    ];
  }*/

  return LOCOMOTIVES[0].tractionModes.map((mode) => ({
    id: `traction-${mode.id}`,
    name: `Traction Mode ${mode.label}`,
    nameRu: `${mode.label}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <line
          x1="2"
          y1="10"
          x2="18"
          y2="10"
          stroke={mode.color}
          strokeWidth="3"
          strokeDasharray={mode.lineStyle === "dashed" ? "4,3" : mode.lineStyle === "dotted" ? "2,2" : "none"}
        />
        <text x="10" y="7" fontSize="5" fill={mode.color} textAnchor="middle" fontWeight="bold">
          {mode.label}
        </text>
      </svg>
    ),
    category: "traction-modes",
    description: `Режим тяги: ${mode.label} (${LOCOMOTIVES[0].name})`,
  }));
};

// =============================================================================
// КОМПОНЕНТ ПАЛИТРЫ ОБЪЕКТОВ
// Object Palette Component
// =============================================================================

interface VisioObjectPaletteProps {
  onDragStart?: (object: PaletteObject) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  selectedLocomotive?: Locomotive | null;
}

export default function VisioObjectPalette({
  onDragStart,
  collapsed = false,
  onToggleCollapse,
  selectedLocomotive = null,
}: VisioObjectPaletteProps) {
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["speed-curve", "traction-modes"]) // Start with speed and traction expanded
  );
  const [draggingObject, setDraggingObject] = useState<string | null>(null);

  // Generate dynamic traction modes category
  const tractionModesCategory: ObjectCategory = {
    id: "traction-modes",
    name: "Traction Modes",
    nameRu: selectedLocomotive ? `Локомотив (${selectedLocomotive.name})` : "Локомотив",
    icon: <Gauge className="size-4" />,
    objects: generateTractionModeObjects(selectedLocomotive),
  };

  // Combine static categories with dynamic traction modes
  // Place traction modes after control-modes for logical grouping
  const allCategories: ObjectCategory[] = [
    ...staticObjectCategories.slice(0, 2), // speed-curve, control-modes
    tractionModesCategory,
    ...staticObjectCategories.slice(2), // remaining categories
  ];

  const handleResizeStart = (e: React.MouseEvent) => {
    if (collapsed) return;
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.max(280, Math.min(500, resizeStartWidth.current - deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, object: PaletteObject) => {
    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify(object));
    e.dataTransfer.effectAllowed = "copy";

    setDraggingObject(object.id);

    if (onDragStart) {
      onDragStart(object);
    }
  };

  const handleDragEnd = () => {
    setDraggingObject(null);
  };

  // Collapsed state - vertical dark strip on RIGHT side
  if (collapsed) {
    return (
      <div
        style={{ width: "100px" }}
        className="top-0 right-0 h-full bg-gray-800 text-white flex flex-col items-center py-4 transition-all duration-300 flex-shrink-0 z-20"
      >
        <button
          onClick={handleToggle}
          style={{  marginBottom: 20, marginRight: 50 }}
          className="p-2 hover:bg-gray-700 rounded transition-colors hover:text-white"
          aria-label="Expand object palette"
          title="Развернуть палитру объектов"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div style={{ marginRight: 50, writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 14, letterSpacing: 2, marginBottom: 8, color: '#fff', whiteSpace: 'nowrap' }}>
          Палитра объектов
        </div>
      </div>
    );
  }

  return (
    <div
      className="top-0 right-0 h-full flex items-stretch z-20 transition-all duration-300"
      style={{
        width: `${sidebarWidth}px`,
        zIndex: 40,
        marginRight: 50,
        minWidth: 120
      }}
    >
      {/* Resize handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={handleResizeStart}
        style={{
          cursor: isResizing ? "col-resize" : "col-resize",
        }}
      />

      {/* Sidebar content */}
      <div className="flex-1 bg-white border-l border-gray-300 flex flex-col shadow-lg">
        {/* Header with separate toggle button and title */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleToggle}
            className="p-2 mr-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            aria-label="Collapse object palette"
            title="Свернуть палитру"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h3 className="text-gray-700 flex-1">Палитра объектов</h3>
        </div>

        {/* Subheader with locomotive info */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <Move className="size-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Перетащите объекты на холст</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="flex-1 scrollbar " style={{ overflow: "auto scroll" }}>
          <div className="p-2 space-y-1">
            {allCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const isTractionCategory = category.id === "traction-modes";

              return (
                <div
                  key={category.id}
                  className={isTractionCategory ? "rounded-lg border border-blue-300 bg-blue-50/30" : "rounded-lg border border-gray-200"}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id) }
                    className={isTractionCategory ? 
                      "w-full flex items-center gap-2 p-2.5 transition-colors bg-blue-50 hover:bg-blue-100"
                      : "w-full flex items-center gap-2 p-2.5 transition-colors bg-gray-50 hover:bg-gray-100"
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={isTractionCategory ? "text-blue-600" : "text-gray-600"}>
                        {category.icon}
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${
                          isTractionCategory ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {category.nameRu}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                        isTractionCategory ? "text-blue-600 bg-blue-100" : "text-gray-500 bg-white"
                      }`}
                    >
                      {category.objects.length}
                    </span>
                  </button>

                  {/* Category Objects */}
                  {isExpanded && (
                    <div className="bg-white">
                      <div className="grid grid-cols-2 gap-1 p-1.5">
                        {category.objects.map((object) => (
                          <div
                            key={object.id}
                            draggable={object.id !== "no-locomotive"}
                            onDragStart={(e) => handleDragStart(e, object)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-1 p-2 rounded border transition-all group ${
                              object.id === "no-locomotive"
                                ? "border-gray-200 bg-gray-50 cursor-default opacity-60"
                                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-move"
                            }`}
                            title={object.description ? object.description : object.nameRu}
                          >
                            {/* Icon */}
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 group-hover:bg-white transition-colors" style={{minWidth: 32}}>
                              {object.icon}
                            </div>
                            {/* Label */}
                            <span className="text-xs text-gray-700 group-hover:text-blue-700 leading-tight line-clamp-2 pl-2">
                              {object.nameRu}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with instructions */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Перетащите объект на холст для размещения
          </p>
        </div>
      </div>
    </div>
  );
}
