import React from 'react';
import { XCircle } from 'lucide-react';
import TrackingAnimation from './animations/TrackingAnimation';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderTrackingProps {
  status: OrderStatus;
}

export default function OrderTracking({ status }: OrderTrackingProps) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
        <XCircle className="w-5 h-5" />
        <span className="font-bold uppercase tracking-widest text-xs">Order Cancelled</span>
      </div>
    );
  }

  return <TrackingAnimation status={status} />;
}
