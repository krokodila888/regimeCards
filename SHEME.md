graph TB
    subgraph "ВХОДНЫЕ ДАННЫЕ"
        TS[TrackSection<br/>Участок пути]
        LOC[Locomotive<br/>Локомотив]
        TR[Train<br/>Состав]
        
        TS --> ST[SingleTrack<br/>Отдельный путь]
        ST --> STAT[Station<br/>Станция]
        ST --> PROF[ProfileElement<br/>Элемент профиля]
        ST --> CAT[TrackCategory<br/>Категория пути]
        CAT --> DSL[DirectionalSpeedLimits<br/>Огр. по направлениям]
        DSL --> SL[SpeedLimit<br/>Ограничение скорости]
        
        LOC --> LR[LocomotiveResistance<br/>Сопротивление]
        LOC --> CP[ControllerPosition<br/>Позиция контроллера]
        CP --> TC[TractiveCharacteristic<br/>Тяговая характеристика]
        LOC --> BC[BrakingCharacteristics<br/>Торможение]
        LOC --> MTC[MotorThermalCharacteristics<br/>Тепловые хар-ки]
        
        TR --> CIT[CarInTrain<br/>Вагон в составе]
        CIT --> CAR[Car<br/>Вагон]
    end
    
    subgraph "КОНФИГУРАЦИЯ РАСЧЕТА"
        CONF[RegimeMapConfiguration<br/>Конфигурация расчета]
        
        TS -.используется.-> CONF
        LOC -.используется.-> CONF
        TR -.используется.-> CONF
        
        CONF --> CSL[CustomSpeedLimit<br/>Польз. ограничения]
        CONF --> MO[MapObject<br/>Объекты на карте]
        CONF --> DIR[Direction<br/>Направление]
    end
    
    subgraph "ПРОЦЕСС РАСЧЕТА"
        CALC[Расчетный модуль]
        CONF ==>|входные данные| CALC
        
        CALC --> SP[SpeedPoint<br/>Точка скорости]
        CALC --> LFP[LongitudinalForcePoint<br/>Продольные силы]
        CALC --> RS[RegimeSegment<br/>Участок режима]
        CALC --> SS[StationStop<br/>Остановка]
    end
    
    subgraph "РЕЗУЛЬТАТЫ РАСЧЕТА"
        RES[RegimeMapResult<br/>Результат расчета]
        
        SP -.массив.-> RES
        LFP -.массив.-> RES
        RS -.массив.-> RES
        SS -.массив.-> RES
        
        RES --> SCHED[TrainSchedule<br/>Расписание]
        SCHED --> SEGS[ScheduleSegment<br/>Сегмент расписания]
        
        CONF -.ссылка.-> RES
    end
    
    subgraph "ВИЗУАЛИЗАЦИЯ"
        VIS[Визуализация<br/>режимной карты]
        RES ==>|данные для отрисовки| VIS
        
        VIS --> SC[SpeedCurve<br/>Кривая скорости]
        VIS --> LC[LimitsCurve<br/>Огр. скорости]
        VIS --> PC[ProfileCurve<br/>Профиль пути]
        VIS --> RM[RegimeBands<br/>Ленты режимов]
        VIS --> FM[ForceMap<br/>Карта сил]
    end
    
    style TS fill:#e1f5ff
    style LOC fill:#e1f5ff
    style TR fill:#e1f5ff
    style CONF fill:#fff4e1
    style CALC fill:#ffe1e1
    style RES fill:#e1ffe1
    style VIS fill:#f0e1ff
