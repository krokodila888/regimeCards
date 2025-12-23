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
  Gauge,
} from "lucide-react";
import { ObjectCategory, PaletteObject, PlacedObject } from "../types/types";
import { ScrollArea } from "./ui/scroll-area";
import { LOCOMOTIVES } from "../types/consts";
import { Locomotive } from "../types/chart-data";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

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
        canvasIcon: (
          <svg width="24" height="32" viewBox="0 0 24 32" className="text-red-600">
            <circle cx="12" cy="12" r="10" fill="white" stroke="currentColor" strokeWidth="2" />
            <text x="12" y="17" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
            <line x1="12" y1="22" x2="12" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="24" height="32" viewBox="0 0 24 32" className="text-yellow-600">
            <circle cx="12" cy="12" r="10" fill="white" stroke="currentColor" strokeWidth="2" strokeDasharray="4,2" />
            <text x="12" y="17" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="bold">
              V
            </text>
            <line x1="12" y1="22" x2="12" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
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
        canvasIcon: (
          <svg width="24" height="32" viewBox="0 0 24 32" className="text-green-600">
            <rect x="6" y="6" width="12" height="10" fill="white" stroke="currentColor" strokeWidth="2" rx="1" />
            <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="12" y1="16" x2="12" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-500">
            <rect x="4" y="10" width="24" height="12" fill="white" stroke="currentColor" strokeWidth="2" rx="2" />
            <path
              d="M8 16 L24 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <text x="16" y="21" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">
              ВЫБ
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-orange-600">
            <rect x="6" y="6" width="20" height="12" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
            <text x="16" y="15" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">
              Т
            </text>
            <line x1="16" y1="18" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "control-modes",
        description: "Служебное пневматическое торможение",
      },
      {
        id: "electric-braking",
        name: "Electric Braking",
        nameRu: "Электрическое торможение",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-500">
            <path d="M2 10 L4 7 L6 13 L8 7 L10 13 L12 7 L14 13 L16 7 L18 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-500">
            <rect x="4" y="8" width="24" height="12" fill="white" stroke="currentColor" strokeWidth="2" rx="2" />
            <path d="M8 14 L10 11 L12 17 L14 11 L16 17 L18 11 L20 17 L22 11 L24 14" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="20" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-600">
            <polygon points="16,4 28,22 4,22" fill="white" stroke="currentColor" strokeWidth="2" />
            <text x="16" y="19" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="bold">
              !
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <path d="M10 4 a6 6 0 1 0 0 12" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <path d="M10 16 a6 6 0 1 0 0-12" fill="#111" stroke="#fff" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
          </svg>
        ),
        canvasIcon: (
          <svg width="24" height="32" viewBox="0 0 24 32">
            <path d="M12 2 a10 10 0 1 0 0 20" fill="#fff" stroke="#000" strokeWidth="2" />
            <path d="M12 22 a10 10 0 1 0 0-20" fill="#111" stroke="#fff" strokeWidth="2" />
            <circle cx="12" cy="12" r="10" fill="none" stroke="#000" strokeWidth="2" />
            <line x1="12" y1="22" x2="12" y2="32" stroke="#000" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
            <rect x="6" y="8" width="20" height="14" fill="white" stroke="currentColor" strokeWidth="2" rx="2" />
            <line x1="10" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="2" />
            <path d="M12 15 Q 16 11, 20 15" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="16" y="19" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">
              РЗД
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "track-objects",
        description: "Разъезд (раздельный пункт)",
      },
      {
        id: "level-crossing-guarded",
        name: "Guarded Level Crossing",
        nameRu: "Переезд с ограждением",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-red-600">
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="3" y1="18" x2="17" y2="18" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="17" x2="4" y2="19" stroke="currentColor" strokeWidth="1" />
            <line x1="16" y1="17" x2="16" y2="19" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-600">
            <circle cx="16" cy="12" r="10" fill="white" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="7" x2="22" y2="17" stroke="currentColor" strokeWidth="2" />
            <line x1="22" y1="7" x2="10" y2="17" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="22" x2="9" y2="26" stroke="currentColor" strokeWidth="1.5" />
            <line x1="23" y1="22" x2="23" y2="26" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "track-objects",
        description: "Переезд с ограждением",
      },
      {
        id: "level-crossing-unguarded",
        name: "Unguarded Level Crossing",
        nameRu: "Переезд без ограждения",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-orange-600">
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="2" />
            <path d="M10 3 L15 10 L5 10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="7" r="0.8" fill="currentColor" />
            <circle cx="8" cy="8.5" r="0.8" fill="currentColor" />
            <circle cx="12" cy="8.5" r="0.8" fill="currentColor" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-orange-600">
            <polygon points="16,2 26,16 6,16" fill="white" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="9" x2="22" y2="21" stroke="currentColor" strokeWidth="2" />
            <line x1="22" y1="9" x2="10" y2="21" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="10" r="1.2" fill="currentColor" />
            <circle cx="13" cy="12" r="1.2" fill="currentColor" />
            <circle cx="19" cy="12" r="1.2" fill="currentColor" />
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
        category: "track-objects",
        description: "Неохраняемый железнодорожный переезд",
      },
      {
        id: "platform",
        name: "Platform",
        nameRu: "Платформа",
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-700">
            <rect x="3" y="10" width="14" height="4" fill="currentColor" />
            <line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="8" x2="4" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="16" y1="8" x2="16" y2="10" stroke="currentColor" strokeWidth="1" />
            <text x="10" y="16" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">
              ПЛ
            </text>
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-700">
            <rect x="6" y="12" width="20" height="8" fill="currentColor" />
            <line x1="8" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="8" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="24" y1="8" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <text x="16" y="18" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">
              ПЛ
            </text>
            <line x1="16" y1="20" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <rect x="6" y="6" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="2" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1" />
            <text x="10" y="13" fontSize="3.5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              КТСМ
            </text>
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
            <rect x="8" y="8" width="16" height="14" fill="white" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" />
            <text x="16" y="17" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">
              КТСМ
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <rect x="7" y="8" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="4" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="0.8" />
            <text x="10" y="15" fontSize="3" fill="currentColor" textAnchor="middle" fontWeight="bold">
              УКСПС
            </text>
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-green-700">
            <rect x="10" y="10" width="12" height="12" fill="white" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="4" x2="16" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="7.5" x2="18" y2="7.5" stroke="currentColor" strokeWidth="1.2" />
            <text x="16" y="18" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              УКСПС
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="6" y1="12" x2="6" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="14" y1="12" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="3" />
            <line x1="4" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" />
            <line x1="5" y1="9" x2="5" y2="12" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="9" x2="15" y2="12" stroke="currentColor" strokeWidth="1" />
            <circle cx="10" cy="6" r="1.5" fill="currentColor" />
            <line x1="10" y1="7.5" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-800">
            <line x1="10" y1="16" x2="10" y2="22" stroke="currentColor" strokeWidth="2" />
            <line x1="22" y1="16" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="3" />
            <line x1="8" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="12" x2="9" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="23" y1="12" x2="23" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="8" r="2" fill="currentColor" />
            <line x1="16" y1="10" x2="16" y2="14" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="4" y1="10" x2="10" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="10" x2="10" y2="15" stroke="currentColor" strokeWidth="2" />
            <rect x="10" y="3" width="6" height="4" rx="1" fill="currentColor" />
            <rect x="10" y="13" width="6" height="4" rx="1" fill="currentColor" />
            <text x="5" y="18" fontSize="4" fill="currentColor" textAnchor="middle">
              МСРП
            </text>
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-600">
            <rect x="6" y="8" width="20" height="14" fill="white" stroke="currentColor" strokeWidth="2" rx="2" />
            <line x1="10" y1="15" x2="16" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="15" x2="16" y2="20" stroke="currentColor" strokeWidth="2" />
            <rect x="16" y="8" width="6" height="4" rx="1" fill="currentColor" />
            <rect x="16" y="18" width="6" height="4" rx="1" fill="currentColor" />
            <text x="12" y="18" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              МСРП
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="7" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <text x="10" y="18" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НТ
            </text>
            <path d="M16 10 L13 8 L13 12 Z" fill="currentColor" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-600">
            <rect x="6" y="10" width="20" height="12" fill="white" stroke="currentColor" strokeWidth="2" rx="2" />
            <line x1="10" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="13" y1="12" x2="15" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="17" y1="12" x2="19" y2="20" stroke="currentColor" strokeWidth="2" />
            <text x="16" y="19" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НТ
            </text>
            <path d="M22 16 L19 14 L19 18 Z" fill="currentColor" />
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-800">
            <path
              d="M6 28 L6 12 Q 6 4, 16 4 Q 26 4, 26 12 L26 28"
              fill="white"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line x1="6" y1="28" x2="26" y2="28" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="28" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-amber-700">
            <line x1="4" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="3" />
            <line x1="8" y1="12" x2="8" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="24" y1="12" x2="24" y2="24" stroke="currentColor" strokeWidth="2" />
            <path d="M4 12 Q 16 6, 28 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="24" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="2.5" />
            <line x1="6" y1="6" x2="6" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="14" y1="6" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" />
            <line x1="3" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-700">
            <line x1="6" y1="10" x2="26" y2="10" stroke="currentColor" strokeWidth="3" />
            <line x1="10" y1="10" x2="10" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="22" y1="10" x2="22" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="6" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="6" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="16" y1="24" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <path d="M2 5 L18 5 Q 18 2, 15 2 Q 10 0, 5 2 Q 2 2, 2 5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" />
            <line x1="2" y1="5" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="18" y1="5" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1" />
            <rect x="3" y="6" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="15" y="6" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-amber-800">
            <path d="M4 8 L28 8 Q 28 4, 24 4 Q 16 2, 8 4 Q 4 4, 4 8" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" />
            <line x1="4" y1="8" x2="4" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="28" y1="8" x2="28" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="2.5" />
            <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <rect x="6" y="10" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="23" y="10" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="16" y1="20" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <rect x="6" y="4" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="10" y="10" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НВ
            </text>
            <line x1="5" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2,2" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-700">
            <rect x="8" y="6" width="16" height="14" fill="white" stroke="currentColor" strokeWidth="2" />
            <text x="16" y="16" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НВ
            </text>
            <line x1="6" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
            <line x1="16" y1="20" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-orange-500">
            <line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" />
            <circle cx="16" cy="16" r="6" fill="white" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="28" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <rect x="5" y="4" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="10" y="10.5" fontSize="5" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НТ
            </text>
            <line x1="10" y1="14" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-black">
            <rect x="8" y="6" width="16" height="16" fill="white" stroke="currentColor" strokeWidth="2" />
            <text x="16" y="17" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">
              НТ
            </text>
            <line x1="16" y1="22" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-600">
            <rect x="10" y="4" width="12" height="10" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="9" r="3" fill="currentColor" />
            <line x1="16" y1="14" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-green-600">
            <rect x="10" y="4" width="12" height="10" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="9" r="3" fill="currentColor" />
            <line x1="16" y1="14" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-yellow-500">
            <circle cx="16" cy="10" r="6" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="10" r="3" fill="currentColor" />
            <line x1="16" y1="16" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="6" y="2" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="5" r="2" fill="currentColor" />
            <path 
              d="M8 5 L10 7 L12 5 L10 4 Z" 
              fill="white" 
              stroke="white" 
              strokeWidth="0.5"
            />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
            <rect x="10" y="4" width="12" height="10" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="9" r="3" fill="currentColor" />
            <path 
              d="M14 9 L16 12 L18 9 L16 7 Z" 
              fill="white" 
              stroke="white" 
              strokeWidth="0.8"
            />
            <line x1="16" y1="14" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="7" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="4" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-700">
            <rect x="11" y="4" width="10" height="10" fill="white" stroke="currentColor" strokeWidth="2" />
            <line x1="13" y1="6" x2="19" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="19" y1="6" x2="13" y2="12" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="14" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="7" y="2.5" width="6" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5 L12 5 L10 7 Z" fill="currentColor" />
          </svg>
        ),
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-yellow-600">
            <rect x="11" y="4" width="10" height="8" rx="1" fill="white" stroke="currentColor" strokeWidth="2" />
            <path d="M13 8 L19 8 L16 11 Z" fill="currentColor" />
            <line x1="16" y1="12" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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
            <line x1="10" y1="6" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <path 
              d="M10 2 L13 5 L10 8 L7 5 Z" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
            />
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
        canvasIcon: (
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-green-700">
            <path 
              d="M16 4 L21 9 L16 14 L11 9 Z" 
              fill="white" 
              stroke="currentColor" 
              strokeWidth="2" 
            />
            <text 
              x="16" 
              y="11" 
              textAnchor="middle" 
              fontSize="6" 
              fontWeight="bold" 
              fill="currentColor"
            >
              У
            </text>
            <line x1="16" y1="14" x2="16" y2="32" stroke="currentColor" strokeWidth="2" />
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

const generateTractionModeObjects = (locomotive: Locomotive): PaletteObject[] => {
  return locomotive.tractionModes.map((mode) => ({
    id: `traction-${locomotive.id}-${mode.id}`,
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
    canvasIcon: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect x="4" y="10" width="24" height="12" fill="white" stroke={mode.color} strokeWidth="2" rx="2" />
        <line
          x1="8"
          y1="16"
          x2="24"
          y2="16"
          stroke={mode.color}
          strokeWidth="3"
          strokeDasharray={mode.lineStyle === "dashed" ? "4,3" : mode.lineStyle === "dotted" ? "2,2" : "none"}
        />
        <text x="16" y="19" fontSize="6" fill={mode.color} textAnchor="middle" fontWeight="bold">
          {mode.label}
        </text>
        <line x1="16" y1="22" x2="16" y2="32" stroke={mode.color} strokeWidth="2" />
      </svg>
    ),
    category: "traction-modes",
    description: `Режим тяги: ${mode.label} (${locomotive.name})`,
  }));
};

// =============================================================================
// ОБЪЕДИНЕНИЕ ВСЕХ КАТЕГОРИЙ С ДИНАМИЧЕСКИМИ РЕЖИМАМИ ТЯГИ
// =============================================================================

const getAllCategories = (): ObjectCategory[] => {
  return staticObjectCategories;
};

const OBJECT_CATEGORIES = getAllCategories();

// =============================================================================
// КОМПОНЕНТ ПАЛИТРЫ ОБЪЕКТОВ
// Object Palette Component
// =============================================================================

// Функция для получения полного объекта по ID (включая icon и canvasIcon)
export function getPaletteObjectById(objectId: string): PaletteObject | null {
  // Проверяем статические категории
  for (const category of staticObjectCategories) {
    const object = category.objects.find(obj => obj.id === objectId);
    if (object) return object;
  }
  
  // Проверяем режимы тяги локомотивов
  for (const locomotive of LOCOMOTIVES) {
    const tractionObjects = generateTractionModeObjects(locomotive);
    const object = tractionObjects.find(obj => obj.id === objectId);
    if (object) return object;
  }
  
  return null;
}

interface VisioObjectPaletteProps {
  selectedObjectId?: string | null;
  placedObjects?: PlacedObject[];
  onDeleteObject?: (id: string) => void;
  onSelectObject?: (id: string | null) => void;
  onUpdateObject?: (id: string, updates: Partial<PlacedObject>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VisioObjectPalette({
  selectedObjectId = null,
  placedObjects = [],
  onDeleteObject,
  onSelectObject,
  onUpdateObject,
  collapsed = false,
  onToggleCollapse,
}: VisioObjectPaletteProps) {
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["speed-curve", "control-modes", "track-objects", "signals"])
  );

  const [editCoordinate, setEditCoordinate] = useState("");
  const [editStationName, setEditStationName] = useState("");

  const displayedObject = selectedObjectId
    ? placedObjects.find(obj => obj.id === selectedObjectId)
    : placedObjects.length > 0
    ? placedObjects[placedObjects.length - 1]
    : null;

  const displayedObjectWithIcon = displayedObject 
    ? {
        ...displayedObject,
        objectType: getPaletteObjectById(displayedObject.objectType.id) || displayedObject.objectType
      }
    : null;

  useEffect(() => {
    if (displayedObjectWithIcon) {
      setEditCoordinate(displayedObjectWithIcon.coordinate.toFixed(1));
      setEditStationName(displayedObjectWithIcon.stationName || "");
    }
  }, [displayedObjectWithIcon?.id, displayedObjectWithIcon?.coordinate, displayedObjectWithIcon?.stationName]);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (collapsed) return;
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(280, Math.min(500, window.innerWidth - e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => setIsResizing(false);

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
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, object: PaletteObject) => {
    e.dataTransfer.setData("application/x-palette-object-id", object.id);
    e.dataTransfer.setData("application/x-palette-object-data", JSON.stringify({
      id: object.id,
      name: object.name,
      nameRu: object.nameRu,
      category: object.category,
      description: object.description,
    }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditCoordinate(e.target.value);
  };

  const handleCoordinateBlur = () => {
    if (!displayedObjectWithIcon || !onUpdateObject) return;
    
    const newCoord = parseFloat(editCoordinate);
    // Проверяем валидность и отличие от текущего значения
    if (!isNaN(newCoord) && newCoord >= 1610 && newCoord <= 1782) {
      if (Math.abs(newCoord - displayedObjectWithIcon.coordinate) > 0.01) {
        // Координата изменилась - обновляем объект
        onUpdateObject(displayedObjectWithIcon.id, { coordinate: newCoord });
      }
    } else {
      // Невалидное значение - возвращаем предыдущее
      setEditCoordinate(displayedObjectWithIcon.coordinate.toFixed(1));
    }
  };

  const handleStationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditStationName(e.target.value);
  };

  const handleStationNameBlur = () => {
    if (!displayedObjectWithIcon || !onUpdateObject) return;
    onUpdateObject(displayedObjectWithIcon.id, { stationName: editStationName });
  };

  if (collapsed) {
    return (
      <div className="w-24 h-full bg-gray-800 text-white flex flex-col items-center py-4" style={{marginRight: 10 }}>
        <button onClick={onToggleCollapse} className="p-2 mb-4 hover:bg-gray-700 rounded" style={{marginRight: 42 }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 14, marginRight: 42 }}>
          Палитра объектов
        </div>
      </div>
    );
  }

  // Найти категорию "Режимы управления поездом"
  const controlModesCategory = OBJECT_CATEGORIES.find(cat => cat.id === "control-modes");

  return (
    <div className="h-full flex" style={{ width: `${sidebarWidth}px`, minWidth: 280, marginRight: 56 }}>
      <div className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize" onMouseDown={handleResizeStart} />

      <div className="flex-1 bg-white border-l border-gray-300 flex flex-col shadow-lg">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <button onClick={onToggleCollapse} className="p-2 hover:bg-gray-200 rounded">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <h3 className="flex-1 font-medium text-gray-700">Палитра объектов</h3>
        </div>

        <div className="p-3 border-b bg-gray-50">
          <p className="text-xs text-gray-500">Перетащите объекты на холст</p>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {OBJECT_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            
            // Специальная обработка для категории "Режимы управления поездом"
            if (category.id === "control-modes") {
              return (
                <div key={category.id} className="rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <div className="text-gray-600">{category.icon}</div>
                    <span className="flex-1 text-sm font-medium text-left">{category.nameRu}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white">
                      {category.objects.length + LOCOMOTIVES[0].length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-white p-1.5 space-y-2">
                      {/* Основные режимы управления */}
                      <div className="grid grid-cols-2 gap-1">
                        {category.objects.map((object) => (
                          <div
                            key={object.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, object)}
                            className="flex flex-col items-center gap-1 p-2 rounded border hover:border-blue-400 hover:bg-blue-50 cursor-move"
                            title={object.description}
                          >
                            <div className="w-8 h-8 flex items-center justify-center">{object.icon}</div>
                            <span className="text-xs text-center leading-tight">{object.nameRu}</span>
                          </div>
                        ))}
                      </div>

                      {/* Локомотивы */}
                      {Array(LOCOMOTIVES[0]).map((locomotive) => {
                        const tractionObjects = generateTractionModeObjects(locomotive);
                        return (
                          <div key={locomotive.id} className="border-t pt-2">
                            <div className="flex items-center gap-2 mb-2 px-2">
                              <Gauge className="w-4 h-4 text-blue-700" />
                              <span className="text-sm font-semibold text-blue-900">
                                {locomotive.name}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100">
                                {tractionObjects.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {tractionObjects.map((mode) => (
                                <div
                                  key={mode.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, mode)}
                                  className="flex flex-col items-center gap-1 p-2 rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 cursor-move"
                                  title={mode.description}
                                >
                                  <div className="w-8 h-8 flex items-center justify-center">{mode.icon}</div>
                                  <span className="text-xs text-center leading-tight">{mode.nameRu}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Обычные категории
            return (
              <div key={category.id} className="rounded-lg border border-gray-200">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <div className="text-gray-600">{category.icon}</div>
                  <span className="flex-1 text-sm font-medium text-left">{category.nameRu}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white">{category.objects.length}</span>
                </button>

                {isExpanded && (
                  <div className="bg-white p-1.5 grid grid-cols-2 gap-1">
                    {category.objects.map((object) => (
                      <div
                        key={object.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, object)}
                        className="flex flex-col items-center gap-1 p-2 rounded border hover:border-blue-400 hover:bg-blue-50 cursor-move"
                        title={object.description}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">{object.icon}</div>
                        <span className="text-xs text-center leading-tight">{object.nameRu}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        {displayedObjectWithIcon && <div className="h-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400" />}

        {/* Info panel */}
        {displayedObjectWithIcon && (
          <div className="border-t-2 border-blue-500 bg-blue-50 p-4 space-y-4" style={{borderTop: '1px solid var(--color-gray-300)'}}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                {displayedObjectWithIcon.objectType.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm text-gray-700">
                    {selectedObjectId ? 'Выбранный объект:' : 'Последний объект'}
                  </h4>
                </div>
                <p className="text-sm font-medium text-gray-700 break-words">
                  {displayedObjectWithIcon.objectType.nameRu}
                </p>
              </div>
            </div>

            <div className="space-y-2 flex-1" style={{position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
            {displayedObjectWithIcon.objectType.id === 'station' && (
              <div className="space-y-2 flex" style={{position: 'relative', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start'}}>
                
                <Input
                  type="text"
                  value={editStationName}
                  onChange={handleStationNameChange}
                  onBlur={handleStationNameBlur}
                  placeholder="Введите название станции"
                  className="h-9 text-sm text-gray-700"
                  style={{width: 160}}
                />
                <Label className="text-sm text-gray-500" style={{paddingTop: 8, fontStyle: 'normal', fontWeight: 'normal'}}>Название</Label>
              </div>
            )}
              
              <div className="flex items-center gap-2" style={{position: 'relative', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start'}}>
                <MapPin className="w-5 h-5 text-gray-500 flex flex-shrink-0" style={{position: 'absolute', top: 8, left: 8}}/>
                <div className="flex-1" style={{width: 'fit-content'}}>
                  <Input
                    type="number"
                    step="0.1"
                    min="1610"
                    max="1782"
                    value={editCoordinate}
                    onChange={handleCoordinateChange}
                    onBlur={handleCoordinateBlur}
                    className="h-9 text-sm pl-8 text-gray-700"
                    style={{width: 160}}
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{width: 'fit-content'}}>Диапазон: 1610-1782 км</p>
                  
                </div>
                <Label className="text-sm text-gray-500" style={{paddingTop: 8, fontStyle: 'normal', fontWeight: 'normal'}}>Координата (км)</Label>
              </div>
              
            </div>

            

            <Button
              variant="destructive"
              onClick={() => onDeleteObject?.(displayedObjectWithIcon.id)}
              className="w-full h-9"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить объект
            </Button>
          </div>
        )}

        {!displayedObjectWithIcon && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center italic">
              Разместите объект на холсте, чтобы увидеть его свойства
            </p>
          </div>
        )}
      </div>
    </div>
  );
}