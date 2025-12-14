import React, { useState } from "react";
import { Search, Check, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type {
  TrackSection,
  WorkflowState,
} from "../types/chart-data";
import { tracks } from "../types/tracks";

interface Stage1TrackSectionProps {
  workflow: WorkflowState;
  onUpdateWorkflow: (updates: Partial<WorkflowState>) => void;
  isOld?: boolean;
}

export default function Stage1TrackSection({
  workflow,
  onUpdateWorkflow,
  isOld = false,
}: Stage1TrackSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = /*TRACK_SECTIONS*/ tracks.filter(
    (section) =>
      section.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const handleSelectSection = (section: TrackSection) => {
    // Update workflow with trackSection AND unlock stage 2 in one call
    // to avoid race condition where second update overwrites first
    onUpdateWorkflow({
      trackSection: section,
      currentStage: 2,
    });
  };

  const handleChangeSection = () => {
    onUpdateWorkflow({
      trackSection: undefined,
      locomotive: undefined,
      trainComposition: undefined,
      customComposition: undefined,
      optimalSpeedCurve: undefined,
      regimeArrows: undefined,
      actualSpeedCurve: undefined,
    });
  };

  if (workflow.trackSection) {
    return (
      <div className="space-y-3">
        <div className="bg-white rounded p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 break-words">
                {workflow.trackSection.name}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Длина: {workflow.trackSection.length} км
              </div>
            </div>
            {!isOld ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleChangeSection}
                      className="flex-shrink-0 h-8 w-8 p-0 text-gray-500 hover:text-gray-200 hover:bg-gray-600"
                      title="Изменить участок"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Изменить участок</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : undefined}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 mb-2">
        Выберите участок пути для создания режимной карты:
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
        <Input
          type="text"
          placeholder="Поиск участка..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white border-gray-400 text-gray-600 text-sm"
        />
      </div>

      {/* Track Sections List */}
      <ScrollArea className="h-[160px] rounded border border-gray-400">
        <div className="p-2 space-y-1">
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSelectSection(section)}
              className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-300 text-gray-600 text-sm"
            >
              <div className="break-words">{section.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {section.length} км
              </div>
            </button>
          ))}
          {filteredSections.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              Участки не найдены
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}