"use client";

import { useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
// 不使用 Sheet，改为内嵌面板
import { AddTaskModal } from "./add-task-modal";
import { Task } from "@/lib/fetchers/task";
import { cn } from "@/lib/utils";

interface TaskCalendarProps {
  workspaceId: string;
  tasks: Task[];
  onCreateTask: (payload: {
    title: string;
    description?: string;
    dueDate?: string;
  }) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  workspaceId: _workspaceId,
  tasks,
  onCreateTask,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  void _workspaceId;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  // MARK: 生成网格数据
  const generateCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });

    const rows: Date[][] = [];
    let day = startDate;

    while (day <= monthEnd || rows.length < 6) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  };

  const rows = generateCalendar();

  // MARK: 计算动态行高 (可复用)
  const WEEK_HEADER_HEIGHT = 32; // px (h-8)
  const GRID_GAP = 0; // border 已占

  const calcCellHeight = () => {
    if (typeof window === "undefined") return 100; // SSR fallback
    const available = window.innerHeight - 130 - WEEK_HEADER_HEIGHT - GRID_GAP; // 保留 header & padding
    return available / 6; // 六行
  };

  const renderDayCell = (date: Date) => {
    const dayTasks = tasks.filter((t) =>
      isSameDay(new Date(t.dueDate || t.createdAt), date)
    );
    const isCurrentMonth = isSameMonth(date, currentMonth);

    const cellHeight = calcCellHeight();

    return (
      <div
        key={date.toISOString()}
        className={cn(
          "relative border-b border-r last:border-r-0 cursor-pointer flex flex-col hover:bg-accent/10 transition-colors",
          !isCurrentMonth ? "opacity-30" : "",
          "group p-2"
        )}
        style={{ height: cellHeight }}
        onClick={() => setSelectedDate(date)}
      >
        <div className="text-base font-medium leading-none mb-0.5 select-none opacity-80">
          {date.getDate()}
        </div>
        {dayTasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className="truncate text-sm rounded bg-primary/20 px-1 mt-1"
          >
            {task.title}
          </div>
        ))}
        {dayTasks.length > 3 && (
          <div className="text-[10px] text-muted-foreground">
            +{dayTasks.length - 3} more
          </div>
        )}

        {/* Hover 快速添加 */}
        <AddTaskModal
          onCreate={onCreateTask}
          defaultDate={date}
          trigger={
            <button
              className={cn(
                "w-6 h-6 absolute bottom-1 right-1 rounded-md bg-primary",
                "flex items-center justify-center  hover:scale-110 transition-all",
                "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <PlusIcon className="size-4 text-white dark:text-black" />
            </button>
          }
        />
      </div>
    );
  };

  const selectedDayTasks = selectedDate
    ? tasks.filter((t) =>
        isSameDay(new Date(t.dueDate || t.createdAt), selectedDate)
      )
    : [];

  return (
    <div className="flex flex-col h-[calc(100vh-86px)] ">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 h-[53px]">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={handlePrevMonth}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleNextMonth}>
            <ArrowRightIcon className="size-4" />
          </Button>
          <span className="font-semibold text-base">
            {format(currentMonth, "MMMM yyyy")}
          </span>
        </div>

        <AddTaskModal
          onCreate={onCreateTask}
          trigger={
            <Button size="sm" variant="outline" className="gap-1">
              <PlusIcon className="size-4" /> 新建任务
            </Button>
          }
        />
      </div>

      {/* Grid + Tasks  */}
      <div
        className={cn(
          "flex flex-1  overflow-hidden h-full",
          "-mb-4",
          "transition-all duration-300 ease-in-out"
          // "xl:py-0 xl:px-2 py-0 px-1 "
        )}
      >
        <div
          className="flex-1 grid grid-cols-7 border-t border-l overflow-hidden"
          style={{ height: "calc(100vh - 124px)" }}
        >
          {/* Weekday headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="h-10 border-b border-r flex items-center justify-center text-xs font-medium bg-muted sticky top-0 z-10"
            >
              {d}
            </div>
          ))}

          {rows.flat().map((date) => renderDayCell(date))}
        </div>

        {/* Tasks Panel */}
        {selectedDate && (
          <div
            className={cn(
              selectedDate ? "w-56 xl:w-80 " : "w-0",
              "flex flex-col overflow-y-auto transform duration-300 ease-in-out",
              "h-[calc(100vh-124px)]",
              "border border-app-border/50 border-b-0 "
            )}
          >
            <div className="h-10 sticky top-0 bg-background py-1 px-4 border-b flex items-center justify-between">
              <span className="font-semibold text-sm">
                {format(selectedDate, "yyyy-MM-dd")}
              </span>
              <button
                className="size-6 flex items-center justify-center rounded hover:bg-muted"
                onClick={() => setSelectedDate(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
              {selectedDayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  暂无任务
                </p>
              ) : (
                selectedDayTasks.map((task) => (
                  <div key={task.id} className="border rounded p-2 text-sm">
                    {task.title}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t">
              <AddTaskModal
                onCreate={onCreateTask}
                defaultDate={selectedDate}
                trigger={
                  <Button variant="outline" className="w-full gap-1">
                    <PlusIcon className="size-4" /> 新建任务
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </div>
      {/* END Flex */}
    </div>
  );
};
