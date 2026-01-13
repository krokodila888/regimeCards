# 🚂 Архитектура данных режимной карты
```mermaid
    graph TB
    %% Основной объект
    ROOT["<b>RegimeMapRenderData</b><br/>Полные данные для отрисовки режимной карты"]
    
    %% Ветвь 1: Метаданные и состав
    ROOT --> META["<b>metadata</b> (объект)<br/>Метаинформация об участке/расчете"]
    META --> META_PROPS1["id: string<br/>ID конфигурации расчета"]
    META --> META_PROPS2["name: string<br/>Название конфигурации"]
    META --> META_PROPS3["createdAt: string (ISO)<br/>Дата создания"]
    META --> META_PROPS4["updatedAt: string (ISO)<br/>Дата изменения"]
    META --> META_PROPS5["direction: 'forward' | 'backward'<br/>Направление движения"]
    META --> TC["<b>trainConfiguration</b> (объект)<br/>Конфигурация подвижного состава"]
    
    TC --> UNITS["<b>units[]</b> (массив)<br/>Единицы подвижного состава<br/>в порядке от головы к хвосту"]
    UNITS --> LOCO["<b>Тип: locomotive</b> (объект)<br/>Локомотив"]
    UNITS --> CAR["<b>Тип: car</b> (объект)<br/>Вагон"]
    
    LOCO --> L_PROPS["<u>Обязательные поля:</u><br/>• type: 'locomotive'<br/>• id: string<br/>• position: number<br/>• series: string"]
    LOCO --> L_OPT["<u>Опциональные:</u><br/>• model: string<br/>• weight: number (т)<br/>• power: number (кВт)<br/>• tractiveForce: number (кН)<br/>• brakingForce: number (кН)<br/>• length: number (м)<br/>• operatingMode: 'master' | 'slave' | 'independent'"]
    
    CAR --> C_PROPS["<u>Обязательные поля:</u><br/>• type: 'car'<br/>• id: string<br/>• position: number<br/>• carType: string"]
    CAR --> C_OPT["<u>Опциональные:</u><br/>• model: string<br/>• weight: object<br/>• length: number (м)<br/>• loadType: 'empty' | 'loaded' | 'partially_loaded'<br/>• axleLoad: number (тс)<br/>• brakeType: 'air' | 'electropneumatic' | 'hand'"]
    
    TC --> SUMMARY["<b>trainSummary</b> (объект)<br/>Сводные параметры поезда"]
    SUMMARY --> S_PROPS["<u>Обязательные:</u><br/>• name: string<br/>• totalWeight: number (т)<br/>• totalLength: number (м)"]
    SUMMARY --> S_OPT["<u>Опциональные:</u><br/>• locomotivesCount: number<br/>• carsCount: number<br/>• totalPower: number (кВт)<br/>• totalTractiveForce: number (кН)<br/>• arrangement: 'single' | 'double_headed' | 'distributed' | 'push_pull'<br/>• controlType: 'single' | 'multiple_unit' | 'radio'"]
    
    %% Ветвь 2: Границы
    ROOT --> BOUNDS["<b>bounds</b> (объект)<br/>Границы и масштабирование карты"]
    BOUNDS --> B_PROPS["<u>Обязательные поля:</u><br/>• startDistance: number (км)<br/>• endDistance: number (км)<br/>• minSpeed: number (км/ч)<br/>• maxSpeed: number (км/ч)<br/>• minGradient: number (‰)<br/>• maxGradient: number (‰)"]
    
    %% Ветвь 3: Профиль пути
    ROOT --> PROFILE["<b>profile[]</b> (массив)<br/>Профиль пути (уклоны и кривые)"]
    PROFILE --> P_ITEM["<b>Элемент массива</b> (объект)"]
    P_ITEM --> PI_PROPS["<u>Обязательные:</u><br/>• start: number (м)<br/>• end: number (м)<br/>• angle: number (‰)<br/>• length: number (м)"]
    
    %% Ветвь 4: Станции
    ROOT --> STATIONS["<b>stations[]</b> (массив)<br/>Станции для отметок"]
    STATIONS --> S_ITEM["<b>Элемент массива</b> (объект)"]
    S_ITEM --> SI_PROPS["<u>Обязательные:</u><br/>• name: string<br/>• coordinate: number (км)"]
    
    %% Ветвь 5: Ограничения скорости
    ROOT --> SPEED_LIMITS["<b>speedLimits[]</b> (массив)<br/>Ограничения скорости"]
    SPEED_LIMITS --> SL_ITEM["<b>Элемент массива</b> (объект)"]
    SL_ITEM --> SLI_PROPS["<u>Обязательные:</u><br/>• start: number (км)<br/>• end: number (км)<br/>• limit: number (км/ч)<br/>• type: 'track_category' | 'custom' | 'temporary'"]
    
    %% Ветвь 6: Кривые скорости
    ROOT --> OPTIMAL_CURVE["<b>optimalSpeedCurve[]</b> (массив)<br/>Оптимальная кривая скорости"]
    OPTIMAL_CURVE --> OC_ITEM["<b>Элемент массива</b> (объект)"]
    OC_ITEM --> OCI_PROPS["<u>Обязательные:</u><br/>• distance: number (км)<br/>• speed: number (км/ч)<br/>• time: number (мин)"]
    
    ROOT --> ACTUAL_CURVE["<b>speedCurve[]</b> (массив)<br/>Кривая скорости"]
    ACTUAL_CURVE --> AC_ITEM["<b>Элемент массива</b> (объект)"]
    AC_ITEM --> ACI_PROPS["<u>Обязательные:</u><br/>• distance: number (км)<br/>• speed: number (км/ч)<br/>• time: number (мин)"]
    
    %% Ветвь 7: Ленты режимов
    ROOT --> REGIME_BANDS["<b>regimeBands[]</b> (массив)<br/>Ленты режимов управления"]
    REGIME_BANDS --> RB_ITEM["<b>Элемент массива</b> (объект)"]
    RB_ITEM --> RBI_PROPS["<u>Обязательные:</u><br/>• start: number (км)<br/>• end: number (км)<br/>• mode: 'acceleration' | 'coasting' | 'braking' | 'constant_speed'"]
    RB_ITEM --> RBI_OPT["<u>Опциональные:</u><br/>• controllerPosition: string"]
    
    %% Ветвь 8: Продольные силы
    ROOT --> LONG_FORCES["<b>longitudinalForces[]</b> (массив)<br/>График продольных сил"]
    LONG_FORCES --> LF_ITEM["<b>Элемент массива</b> (объект)"]
    LF_ITEM --> LFI_PROPS["<u>Обязательные:</u><br/>• coordinate: number (м)<br/>• tension: number (кН) ≥ 0<br/>• compression: number (кН) ≥ 0"]
    LF_ITEM --> LFI_OPT["<u>Опциональные:</u><br/>• maxAllowable: number (кН)<br/>• time: number (мин)"]
    
    %% Ветвь 9: Значки
    ROOT --> MARKS["<b>marks[]</b> (массив)<br/>Значки на карте"]
    MARKS --> M_ITEM["<b>Элемент массива</b> (объект)"]
    M_ITEM --> MI_PROPS["<u>Обязательные:</u><br/>• type: string<br/>• distance: number (м)"]
    M_ITEM --> MI_OPT["<u>Опциональные:</u><br/>• label: string"]
    M_ITEM --> MI_TYPES["<u>Допустимые типы:</u><br/>• brake_test • picket<br/>• neutral_start • neutral_end<br/>• water_intake • signal<br/>• switch • crossing<br/>• tunnel_start • tunnel_end<br/>• bridge_start • bridge_end"]
    
    %% Стилизация
    classDef required fill:#e1f5e1,stroke:#2e7d32,stroke-width:2px
    classDef optional fill:#e3f2fd,stroke:#1565c0,stroke-width:1px
    classDef array fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px
    classDef object fill:#fff3e0,stroke:#ef6c00,stroke-width:1px
    
    class META_PROPS1,META_PROPS2,META_PROPS5,L_PROPS,C_PROPS,S_PROPS,B_PROPS,PI_PROPS,SI_PROPS,SLI_PROPS,OCI_PROPS,ACI_PROPS,RBI_PROPS,LFI_PROPS,MI_PROPS required
    class L_OPT,C_OPT,S_OPT,RBI_OPT,LFI_OPT,MI_OPT optional
    class UNITS,PROFILE,STATIONS,SPEED_LIMITS,OPTIMAL_CURVE,ACTUAL_CURVE,REGIME_BANDS,LONG_FORCES,MARKS array
    class ROOT,META,TC,LOCO,CAR,SUMMARY,BOUNDS,P_ITEM,S_ITEM,SL_ITEM,OC_ITEM,AC_ITEM,RB_ITEM,LF_ITEM,M_ITEM object