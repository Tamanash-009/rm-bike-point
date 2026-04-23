import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore, 
  startOfToday,
  isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function ServiceCalendar({ selectedDate, onDateSelect }: ServiceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    if (isSameMonth(currentMonth, today)) return;
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex flex-col">
        <h3 className="text-xl font-black uppercase tracking-tighter text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Select Workshop Date</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={prevMonth}
          disabled={isSameMonth(currentMonth, today)}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextMonth}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isDisabled = isBefore(day, today) || !isSameMonth(day, monthStart);
        const isSelected = selectedDate === format(day, 'yyyy-MM-dd');
        const currentIsToday = isToday(day);

        days.push(
          <button
            key={day.toString()}
            disabled={isDisabled}
            onClick={() => onDateSelect(format(cloneDay, 'yyyy-MM-dd'))}
            className={cn(
              "relative h-14 w-full flex flex-col items-center justify-center rounded-2xl transition-all border group",
              isDisabled 
                ? "opacity-10 border-transparent cursor-not-allowed" 
                : "hover:border-brand-orange/50 hover:bg-brand-orange/5 active:scale-95",
              isSelected 
                ? "bg-brand-orange border-brand-orange text-black font-black shadow-lg shadow-brand-orange/20" 
                : "bg-white/5 border-white/5 text-white/60",
              !isSelected && currentIsToday && "border-brand-orange/30 text-brand-orange"
            )}
          >
            <span className="text-sm z-10">{formattedDate}</span>
            {currentIsToday && !isSelected && (
               <div className="absolute bottom-2 w-1 h-1 bg-brand-orange rounded-full" />
            )}
            {isSelected && (
              <motion.div
                layoutId="active-calendar-day"
                className="absolute inset-0 bg-brand-orange rounded-2xl"
                style={{ zIndex: 0 }}
              />
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 mb-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth.toString()}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {renderCells()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-center gap-6">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-brand-orange" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-[9px]">Selected</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-brand-orange/10 border border-brand-orange/30" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-[9px]">Today</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/5 border border-white/5" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-[9px]">Available</span>
         </div>
      </div>
    </div>
  );
}
