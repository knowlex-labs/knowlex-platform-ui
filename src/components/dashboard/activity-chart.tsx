import { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { ChartDataPoint, ChartPeriod } from '@/types/dashboard.types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface ActivityChartProps {
  data: ChartDataPoint[]
  period: ChartPeriod
  onPeriodChange: (period: ChartPeriod) => void
}

export function ActivityChart({ data, period, onPeriodChange }: ActivityChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null)

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Cases',
        data: data.map((d) => d.cases),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Drafts',
        data: data.map((d) => d.drafts),
        backgroundColor: 'rgba(20, 184, 166, 0.7)',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        cornerRadius: 8,
        padding: 10,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { font: { size: 11 }, stepSize: 5 },
      },
    },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-kx-primary-900">Activity</h2>
        <div className="flex bg-ledger-gray-100 dark:bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => onPeriodChange('week')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              period === 'week'
                ? 'bg-kx-card text-kx-primary-900 shadow-sm'
                : 'text-ledger-gray-500 hover:text-kx-primary-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onPeriodChange('month')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              period === 'month'
                ? 'bg-kx-card text-kx-primary-900 shadow-sm'
                : 'text-ledger-gray-500 hover:text-kx-primary-900'
            }`}
          >
            Month
          </button>
        </div>
      </div>
      <div className="h-56">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  )
}
