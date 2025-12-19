import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Info,
  MapPin,
  Activity,
  AlertTriangle,
  Power,
  Route,
  Zap,
} from "lucide-react";
import { ObjectCategory, PaletteObject, PlacedObject } from "../types/types";
import { ScrollArea } from "./ui/scroll-area";
import { LOCOMOTIVES } from "../types/consts";
import { Locomotive } from "../types/chart-data";
import { Button } from "./ui/button";

// Примеры категорий объектов (сокращенная версия)
/*const EXAMPLE_CATEGORIES: ObjectCategory[] = [
  {
    id: "speed-curve",
    name: "Speed & Movement",
    nameRu: "Кривая скорости и ограничения",
    icon: <MapPin className="w-4 h-4" />,
    objects: [
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
        description: "Временное ограничение скорости",
      },
    ],
  },
  {
    id: "track-objects",
    name: "Track Objects",
    nameRu: "Раздельные пункты и объекты",
    icon: <MapPin className="w-4 h-4" />,
    objects: [
      {
        id: "station",
        name: "Station",
        nameRu: "Станция",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M10 4 a6 6 0 1 0 0 12" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <path d="M10 16 a6 6 0 1 0 0-12" fill="#111" stroke="#fff" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
          </svg>
        ),
        category: "track-objects",
        description: "Железнодорожная станция",
      },
    ],
  },
];*/

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
      /*{
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
      },*/
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
          <svg width="20" height="20" viewBox="0 0 20 20">
            {/* Левая половина круга — белая */}
            <path d="M10 4 a6 6 0 1 0 0 12" fill="#fff" stroke="#000" strokeWidth="1.5" />
            {/* Правая половина круга — черная */}
            <path d="M10 16 a6 6 0 1 0 0-12" fill="#111" stroke="#fff" strokeWidth="1.5" />
            {/* Внешний черный контур по всему кругу */}
            <circle cx="10" cy="10" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
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


// Функция для получения полного объекта по ID (включая icon)
export function getPaletteObjectById(objectId: string): PaletteObject | null {
  for (const category of staticObjectCategories) {
    const object = category.objects.find(obj => obj.id === objectId);
    if (object) return object;
  }
  return null;
}

interface VisioObjectPaletteProps {
  selectedObjectId?: string | null;
  placedObjects?: PlacedObject[];
  onDeleteObject?: (id: string) => void;
  onSelectObject?: (id: string | null) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VisioObjectPalette({
  selectedObjectId = null,
  placedObjects = [],
  onDeleteObject,
  onSelectObject,
  collapsed = false,
  onToggleCollapse,
}: VisioObjectPaletteProps) {
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["speed-curve", "track-objects"])
  );

  // Получаем выбранный объект или последний добавленный
  const displayedObject = selectedObjectId
    ? placedObjects.find(obj => obj.id === selectedObjectId)
    : placedObjects.length > 0
    ? placedObjects[placedObjects.length - 1]
    : null;

  // Получаем полный объект с иконкой для отображения
  const displayedObjectWithIcon = displayedObject 
    ? {
        ...displayedObject,
        objectType: getPaletteObjectById(displayedObject.objectType.id) || displayedObject.objectType
      }
    : null;

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
    // Передаем ID объекта
    e.dataTransfer.setData("application/x-palette-object-id", object.id);
    
    // Передаем данные объекта БЕЗ поля icon (оно не сериализуется)
    const objectDataWithoutIcon = {
      id: object.id,
      name: object.name,
      nameRu: object.nameRu,
      category: object.category,
      description: object.description,
    };
    
    e.dataTransfer.setData("application/x-palette-object-data", JSON.stringify(objectDataWithoutIcon));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDeleteClick = () => {
    if (displayedObjectWithIcon && onDeleteObject) {
      onDeleteObject(displayedObjectWithIcon.id);
    }
  };

  // Collapsed state
  if (collapsed) {
    return (
      <div
        style={{ width: "100px" }}
        className="h-full bg-gray-800 text-white flex flex-col items-center py-4 transition-all duration-300 flex-shrink-0 z-20"
      >
        <button
          onClick={onToggleCollapse}
          style={{ marginBottom: 20, marginRight: 50 }}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Развернуть палитру объектов"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div style={{ 
          marginRight: 50, 
          writingMode: 'vertical-rl', 
          transform: 'rotate(180deg)', 
          fontSize: 14, 
          letterSpacing: 2, 
          color: '#fff' 
        }}>
          Палитра объектов
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex items-stretch z-20 transition-all duration-300 z-150"
      style={{ width: `${sidebarWidth}px`, minWidth: 280, marginRight: 50 }}
    >
      {/* Resize handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={handleResizeStart}
      />

      {/* Sidebar content */}
      <div className="flex-1 bg-white border-l border-gray-300 flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onToggleCollapse}
            className="p-2 mr-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
            title="Свернуть палитру"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <h3 className="text-gray-700 flex-1 font-medium">Палитра объектов</h3>
        </div>

        {/* Subheader */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Перетащите объекты на холст для размещения
          </p>
        </div>

        {/* Categories */}
        <ScrollArea className="flex-1" style={{ overflow: "auto" }}>
          <div className="p-2 space-y-1">
            {staticObjectCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);

              return (
                <div
                  key={category.id}
                  className="rounded-lg border border-gray-200"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-2 p-2.5 transition-colors bg-gray-50 hover:bg-gray-100"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-gray-600">{category.icon}</div>
                      <span className="text-sm font-medium truncate text-gray-900">
                        {category.nameRu}
                      </span>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white text-gray-500">
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, object)}
                            className="flex items-center gap-1 p-2 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-move transition-all"
                            title={object.description || object.nameRu}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 group-hover:bg-white" style={{minWidth: 32}}>
                              {object.icon}
                            </div>
                            <span className="text-xs text-gray-700 hover:text-blue-700 leading-tight line-clamp-2 pl-2">
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

        {/* Info panel for selected/last added object */}
        {displayedObjectWithIcon && (
          <div className="flex-shrink-0 border-t-2 border-blue-500 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded border-2 border-blue-500 flex items-center justify-center">
                <div style={{ transform: 'scale(1.4)' }}>
                  {displayedObjectWithIcon.objectType.icon}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    {selectedObjectId ? 'Выбранный объект' : 'Последний добавленный'}
                  </h4>
                </div>
                
                <p className="text-sm text-gray-700 font-medium mb-2">
                  {displayedObjectWithIcon.objectType.nameRu}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                  <MapPin className="w-3 h-3" />
                  <span className="font-mono">
                    км {displayedObjectWithIcon.coordinate.toFixed(3)}
                  </span>
                </div>

                {displayedObjectWithIcon.objectType.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {displayedObjectWithIcon.objectType.description}
                  </p>
                )}
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить объект
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer hint */}
        {!displayedObjectWithIcon && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Разместите объект на холсте, чтобы увидеть информацию
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
