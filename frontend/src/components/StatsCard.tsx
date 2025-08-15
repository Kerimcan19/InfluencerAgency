import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatData {
  title: string;
  value: string;
  change: string;
  icon: typeof LucideIcon;
  color: string;
}

interface StatsCardProps {
  stat: StatData;
  delay?: number;
}

export function StatsCard({ stat, delay = 0 }: StatsCardProps) {
  const Icon = stat.icon;
  const isPositive = stat.change.startsWith('+');

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            <div className="flex items-center mt-2">
              
            </div>
          </div>
          <div className={`p-3 rounded-lg ${stat.color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}