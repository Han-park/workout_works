import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ProteinData {
  date: string
  total: number
}

const COLORS = {
  neutral: '#D9D9D9',
  protein: '#FFFFFF'
}

interface ProteinIntakeChartProps {
  proteinData: ProteinData[]
  proteinGoal: number
  currentWeek: Date
  dateRangeText: string
  onWeekChange: (weeks: number) => void
  className?: string
}

export default function ProteinIntakeChart({ 
  proteinData, 
  proteinGoal, 
  currentWeek, 
  dateRangeText,
  onWeekChange 
}: ProteinIntakeChartProps) {
  // Generate a unique key for charts to force re-rendering
  const chartKey = `protein-chart-${currentWeek.getTime()}`

  const proteinChartData: ChartData<'bar' | 'line'> = {
    labels: proteinData.map(item => {
      const date = new Date(item.date);
      return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`;
    }),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Protein Intake (g)',
        data: proteinData.map(item => item.total),
        backgroundColor: COLORS.protein,
        borderColor: COLORS.protein,
        borderWidth: 1,
        barThickness: 25,
        maxBarThickness: 35,
        order: 2
      },
      {
        type: 'line' as const,
        label: 'Protein Goal',
        data: Array(proteinData.length).fill(proteinGoal),
        borderColor: '#D8110A',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        fill: false,
        order: 1
      }
    ] as const
  };

  // Calculate max protein value for better y-axis scaling
  const maxProteinValue = Math.max(...proteinData.map(item => item.total), 0);
  
  const proteinChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500 // Faster animations for smoother transitions
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
        }
      },
      title: {
        display: true,
        text: 'Weekly Protein Intake',
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
            family: 'Inter, system-ui, sans-serif',
            size: 11
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          autoSkipPadding: 15
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: COLORS.neutral,
          font: {
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 5,
          stepSize: 40,
          maxTicksLimit: 8,
          precision: 0
        },
        title: {
          display: true,
          text: 'Protein (g)',
          color: COLORS.neutral,
          font: {
            family: 'Inter, system-ui, sans-serif'
          },
          padding: {
            top: 0,
            bottom: 0
          }
        },
        suggestedMin: 0,
        suggestedMax: Math.max(proteinGoal * 1.2, maxProteinValue * 1.2, 240)
      }
    },
    layout: {
      padding: {
        left: 15,
        right: 15,
        top: 20,
        bottom: 10
      }
    }
  };

  return (
    <div className="bg-[#111111] rounded-lg shadow-2xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => onWeekChange(-1)}
          className="flex items-center text-neutral-300 hover:text-white transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Previous
        </button>
        <span className="text-md text-neutral-300">{dateRangeText}</span>
        <button
          onClick={() => onWeekChange(1)}
          className="flex items-center text-neutral-300 hover:text-white transition-colors"
        >
          Next
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="w-full h-[400px]">
        <ReactChart
          key={chartKey}
          type="bar"
          data={proteinChartData}
          options={proteinChartOptions}
        />
      </div>
    </div>
  );
} 