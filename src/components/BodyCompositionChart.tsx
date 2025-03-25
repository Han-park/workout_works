import { Line } from 'react-chartjs-2'
import type { LegendItem } from 'chart.js'

interface Metric {
  id: number
  created_at: string
  weight: number | null
  skeletal_muscle_mass: number
  percent_body_fat: number
}

interface Goal {
  skeletal_muscle_mass: number
  percent_body_fat: number
}

const COLORS = {
  primary: '#D8110A',
  secondary: '#FFFFFF',
  neutral: '#D9D9D9'
}

const calculateMovingAverage = (data: number[], windowSize: number = 3) => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    
    // Look back and forward windowSize/2 points
    for (let j = Math.max(0, i - Math.floor(windowSize/2)); 
         j < Math.min(data.length, i + Math.floor(windowSize/2) + 1); 
         j++) {
      sum += data[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
};

interface BodyCompositionChartProps {
  metrics: Metric[]
  goals: Goal
}

export default function BodyCompositionChart({ metrics, goals }: BodyCompositionChartProps) {
  const chartData = {
    labels: metrics.map(metric => new Date(metric.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Skeletal Muscle Mass (kg)',
        data: metrics.map(metric => metric.skeletal_muscle_mass),
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}33`,
        borderWidth: 0,
        pointRadius: 4,
        pointStyle: 'crossRot',
        pointBackgroundColor: COLORS.primary,
        pointBorderColor: COLORS.primary,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Body Fat (%)',
        data: metrics.map(metric => metric.percent_body_fat),
        borderColor: COLORS.secondary,
        backgroundColor: `${COLORS.secondary}33`,
        borderWidth: 0,
        pointRadius: 4,
        pointStyle: 'crossRot',
        pointBackgroundColor: COLORS.secondary,
        pointBorderColor: COLORS.secondary,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
      {
        label: 'Muscle Mass Goal',
        data: Array(metrics.length).fill(goals.skeletal_muscle_mass),
        borderColor: COLORS.primary,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
        yAxisID: 'y',
        tension: 0,
      },
      {
        label: 'Body Fat Goal',
        data: Array(metrics.length).fill(goals.percent_body_fat),
        borderColor: COLORS.secondary,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
        yAxisID: 'y1',
        tension: 0,
      },
      {
        label: 'Muscle Mass Trend',
        data: calculateMovingAverage(metrics.map(metric => metric.skeletal_muscle_mass)),
        borderColor: COLORS.primary,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Body Fat Trend',
        data: calculateMovingAverage(metrics.map(metric => metric.percent_body_fat)),
        borderColor: COLORS.secondary,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y1',
        tension: 0.4,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: COLORS.neutral,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          },
          padding: 10,
          filter: (item: LegendItem) => !item.text?.includes('Trend')
        }
      },
      title: {
        display: true,
        text: 'Body Composition Metrics Over Time',
        color: COLORS.neutral,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 500
        },
        padding: {
          top: 0,
          bottom: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: COLORS.neutral,
        bodyColor: COLORS.neutral,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        titleFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        filter: (tooltipItem: any) => {
          return !tooltipItem.dataset.label.includes('Goal');
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: COLORS.neutral,
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: COLORS.primary,
          font: {
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 5
        },
        title: {
          display: true,
          text: 'Skeletal Muscle Mass (kg)',
          color: COLORS.primary,
          font: {
            family: 'Inter, system-ui, sans-serif'
          },
          padding: {
            top: 0,
            bottom: 0
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: COLORS.secondary,
          font: {
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 5
        },
        title: {
          display: true,
          text: 'Body Fat (%)',
          color: COLORS.secondary,
          font: {
            family: 'Inter, system-ui, sans-serif'
          },
          padding: {
            top: 0,
            bottom: 0
          }
        }
      },
    },
  }

  return (
    <div className="bg-[#111111] rounded-lg shadow-2xl p-6 border border-gray-800">
      <div className="w-full h-[400px]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  )
} 