import React from 'react';
import { CheckCircle2, Circle, Clock, Truck, Package, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderTrackingProps {
  status: OrderStatus;
}

const STAGES: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderTracking({ status }: OrderTrackingProps) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
        <XCircle className="w-5 h-5" />
        <span className="font-bold uppercase tracking-widest text-xs">Order Cancelled</span>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.status === status);

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-1000" 
          style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, index) => {
          const isCompleted = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.status} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isCompleted 
                    ? "bg-brand-orange border-brand-orange text-white shadow-[0_0_15px_rgba(255,46,99,0.4)]" 
                    : "bg-[#0B0B0B] border-white/10 text-gray-500"
                )}
              >
                <Icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
              </div>
              <div className="absolute -bottom-8 whitespace-nowrap">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter transition-colors duration-500",
                  isCompleted ? "text-white" : "text-gray-500"
                )}>
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
