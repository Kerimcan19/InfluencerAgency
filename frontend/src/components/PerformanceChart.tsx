import React from 'react';

export interface ChartPoint {
  day: string;     // e.g., 'Mon', 'Tue', or '2025-08-08'
  sales: number;   // totalSales for that day
  clicks: number;  // totalClicks for that day
}

export function PerformanceChart({
  data = [],
  totals,
}: {
  data: ChartPoint[];
  totals?: { sales: number; clicks: number; conv: number };
}) {
  const maxSales = data.length ? Math.max(...data.map(d => d.sales)) : 0;
  const maxClicks = data.length ? Math.max(...data.map(d => d.clicks)) : 0;

  if (!data.length) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">
        No data for the selected period
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600">Sales ($)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
          <span className="text-gray-600">Clicks</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 flex items-end justify-between space-x-4 px-4">
        {data.map((item, index) => (
          <div key={item.day} className="flex-1 flex flex-col items-center space-y-2">
            {/* Bars */}
            <div className="flex items-end space-x-1 h-48">
              {/* Sales bar */}
              <div 
                className="bg-purple-500 rounded-t-sm w-4 transition-all duration-1000 ease-out hover:bg-purple-600"
                style={{ 
                  height: `${(item.sales / maxSales) * 180}px`,
                  animationDelay: `${index * 100}ms`
                }}
                title={`Sales: $${item.sales.toLocaleString()}`}
              ></div>
              
              {/* Clicks bar */}
              <div 
                className="bg-teal-500 rounded-t-sm w-4 transition-all duration-1000 ease-out hover:bg-teal-600"
                style={{ 
                  height: `${(item.clicks / maxClicks) * 180}px`,
                  animationDelay: `${index * 100 + 50}ms`
                }}
                title={`Clicks: ${item.clicks.toLocaleString()}`}
              ></div>
            </div>
            
            {/* Day label */}
            <span className="text-xs text-gray-500 font-medium">{item.day}</span>
          </div>
        ))}
      </div>

      {/* Values */}
      {totals && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {totals.sales.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Sales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-600">
              {totals.clicks.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {totals.conv}%
            </p>
            <p className="text-sm text-gray-500">Conv. Rate</p>
          </div>
        </div>
      )}
    </div>
  );
}