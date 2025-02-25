'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type LegendItem
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
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

interface ProteinData {
  date: string
  total: number
}

const COLORS = {
  primary: '#D8110A',
  secondary: '#FFFFFF',
  neutral: '#D9D9D9',
  protein: '#4CAF50'
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

// Helper function to get start and end dates for a week
const getWeekDates = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
};

// Helper function to format date as YYYY-MM-DD
const formatDateForDB = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function GraphPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [goals, setGoals] = useState<Goal>({ skeletal_muscle_mass: 0, percent_body_fat: 0 })
  const [proteinData, setProteinData] = useState<ProteinData[]>([])
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [proteinGoal, setProteinGoal] = useState<number>(160)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const fetchProteinData = useCallback(async (weekDate: Date) => {
    try {
      const { monday, sunday } = getWeekDates(weekDate);
      
      const { data: mealData, error: mealError } = await supabase
        .from('meal')
        .select('*')
        .eq('UID', user?.id || '')
        .gte('recognition_date', formatDateForDB(monday))
        .lte('recognition_date', formatDateForDB(sunday))
        .order('recognition_date', { ascending: true });

      if (mealError) throw mealError;

      // Process data to get daily totals
      const dailyTotals: Record<string, number> = {};
      
      // Initialize all days of the week with 0
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        dailyTotals[formatDateForDB(day)] = 0;
      }
      
      // Sum protein content by day
      mealData?.forEach(meal => {
        const date = meal.recognition_date;
        dailyTotals[date] = (dailyTotals[date] || 0) + meal.protein_content;
      });
      
      // Convert to array format for chart
      const proteinDataArray = Object.entries(dailyTotals).map(([date, total]) => ({
        date,
        total
      }));
      
      console.log('Fetched protein data:', proteinDataArray);
      setProteinData(proteinDataArray);
    } catch (err) {
      console.error('Error fetching protein data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch protein data');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    async function fetchData() {
      try {
        // Fetch metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('metric')
          .select('*')
          .eq('UID', user?.id || '')
          .order('created_at', { ascending: true })

        if (metricsError) throw metricsError

        // Sort the metrics data
        const sortedData = [...(metricsData || [])].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        setMetrics(sortedData)

        // Fetch latest goal
        const { data: goalData, error: goalError } = await supabase
          .from('goal')
          .select('skeletal_muscle_mass, percent_body_fat')
          .eq('UID', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(1)

        if (goalError) throw goalError

        if (goalData && goalData.length > 0) {
          setGoals(goalData[0])
        }

        // Fetch latest weight for protein goal calculation
        const { data: weightData } = await supabase
          .from('metric')
          .select('weight')
          .eq('UID', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(1)

        if (weightData && weightData.length > 0 && weightData[0].weight) {
          setProteinGoal(Math.round(weightData[0].weight * 2));
        }

        // Fetch protein data for the current week
        await fetchProteinData(currentWeek);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router, currentWeek, fetchProteinData])

  const handleWeekChange = (weeks: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setCurrentWeek(newDate);
    // Force chart to reinitialize with new data
    ChartJS.unregister(CategoryScale);
    ChartJS.register(CategoryScale);
    console.log('reinitialized');
  };

const chartData = {
    labels: metrics.map(metric => new Date(metric.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Skeletal Muscle Mass (kg)',
        data: metrics.map(metric => metric.skeletal_muscle_mass),
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}33`,
        borderWidth: 2,
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Body Fat (%)',
        data: metrics.map(metric => metric.percent_body_fat),
        borderColor: COLORS.secondary,
        backgroundColor: `${COLORS.secondary}33`,
        borderWidth: 2,
        yAxisID: 'y1',
        tension: 0.4,
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
        borderDash: [2, 2],
      },
      {
        label: 'Body Fat Trend',
        data: calculateMovingAverage(metrics.map(metric => metric.percent_body_fat)),
        borderColor: COLORS.secondary,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y1',
        tension: 0.4,
        borderDash: [2, 2],
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

  // Protein chart data
  const proteinChartData = {
    labels: proteinData.map(item => {
      const date = new Date(item.date);
      return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Protein Intake (g)',
        data: proteinData.map(item => {
          console.log(`Protein intake for ${item.date}: ${item.total}g`);
          return item.total;
        }),
        backgroundColor: COLORS.protein,
        borderColor: COLORS.protein,
        borderWidth: 1,
        barThickness: 25,
        maxBarThickness: 35
      }
    ]
  };

  // Separate goal line data
  const proteinGoalData = {
    labels: proteinData.map(item => {
      const date = new Date(item.date);
      return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Protein Goal',
        data: Array(proteinData.length).fill(proteinGoal),
        borderColor: `${COLORS.protein}88`,
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        fill: false,
      }
    ]
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
            size: 11 // Slightly smaller font size
          },
          maxRotation: 45, // Allow some rotation for better spacing
          minRotation: 45, // Ensure consistent rotation
          autoSkip: true,
          autoSkipPadding: 15 // Increased padding between labels
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
          stepSize: 40, // Larger step size to reduce number of ticks
          maxTicksLimit: 8, // Limit number of ticks
          precision: 0 // No decimal places
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
        // Dynamic max value based on data and goal
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

  // Effect to destroy and recreate charts when data changes
  useEffect(() => {
    // This will run when proteinData changes
    return () => {
      // Cleanup function to destroy any existing charts
      ChartJS.unregister(CategoryScale);
      ChartJS.register(CategoryScale);
    };
  }, [proteinData]);

  const handleAddMetric = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInputError(null)

    if (!user) {
      setInputError('You must be logged in to add metrics')
      return
    }

    const formData = new FormData(e.currentTarget)
    const weight = formData.get('weight')
    const muscleMass = formData.get('muscleMass')
    const bodyFat = formData.get('bodyFat')
    
    // Validate inputs
    if (!weight || !muscleMass || !bodyFat) {
      setInputError('Please fill in all fields')
      return
    }

    const weightValue = parseFloat(weight as string)
    const muscleValue = parseFloat(muscleMass as string)
    const fatValue = parseFloat(bodyFat as string)

    if (isNaN(weightValue) || isNaN(muscleValue) || isNaN(fatValue)) {
      setInputError('Please enter valid numbers')
      return
    }

    try {
      const { data, error: insertError } = await supabase
        .from('metric')
        .insert([
          {
            created_at: new Date().toISOString(),
            weight: weightValue,
            skeletal_muscle_mass: muscleValue,
            percent_body_fat: fatValue,
            UID: user.id
          }
        ])
        .select()

      if (insertError) throw insertError

      // Add new metric to state and sort
      const newMetrics = [...metrics, data[0]].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMetrics(newMetrics)
      
      // Close dialog and reset form
      dialogRef.current?.close()
      formRef.current?.reset()
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Failed to add data')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-xl text-white">Loading metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    )
  }

  // Format date range for display
  const { monday, sunday } = getWeekDates(currentWeek);
  const dateRangeText = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
  
  // Generate a unique key for charts to force re-rendering
  const chartKey = `protein-chart-${currentWeek.getTime()}`;

  return (
    
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header onAddClick={() => dialogRef.current?.showModal()} />
      <div className="flex-1 p-8">
        <div className="bg-[#111111] rounded-lg shadow-2xl p-6 border border-gray-800">
          <div className="w-full h-[400px]">
            <Line options={options} data={chartData} />
          </div>
        </div>
        
        {/* Protein Intake Graph with Weekly Navigation */}
        <div className="mt-8 bg-[#111111] rounded-lg shadow-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => handleWeekChange(-1)}
              className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium text-white/90">{dateRangeText}</h2>
            <button 
              onClick={() => handleWeekChange(1)}
              className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
              aria-label="Next week"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full h-[350px] relative">
            <Bar 
              key={chartKey} 
              options={proteinChartOptions} 
              data={proteinChartData} 
            />
            <div className="absolute inset-0 pointer-events-none">
              <Line 
                key={`${chartKey}-goal`}
                options={{
                  ...proteinChartOptions,
                  plugins: {
                    ...proteinChartOptions.plugins,
                    legend: { display: false },
                    tooltip: { enabled: false }
                  }
                }}
                data={proteinGoalData}
              />
            </div>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="mt-8 mb-8 bg-[#111111] rounded-lg shadow-2xl border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                    Weight (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                    Skeletal Muscle Mass (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#D9D9D9] uppercase tracking-wider">
                    Body Fat (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className="bg-[#1a1a1a]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#D9D9D9]">
                    Goal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#D9D9D9]">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#D8110A]">
                    {goals.skeletal_muscle_mass}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {goals.percent_body_fat}
                  </td>
                </tr>
                {metrics.map((metric, index) => (
                  <tr key={metric.id} className={index % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#111111]'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D9D9D9]">
                      {new Date(metric.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D9D9D9]">
                      {metric.weight ?? 'NaN'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D8110A]">
                      {metric.skeletal_muscle_mass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {metric.percent_body_fat}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Metric Input Dialog */}
      <dialog
        ref={dialogRef}
        className="p-0 bg-[#111111] text-white rounded-lg backdrop:bg-black backdrop:bg-opacity-50"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current.close()
          }
        }}
      >
        <div className="p-6 min-w-[400px]">
          <h2 className="text-xl font-semibold mb-4">Add New Data</h2>
          <p className="text-sm text-[#D9D9D9]/50 mb-4">
             {new Date().toLocaleDateString()}
          </p>
          <form ref={formRef} onSubmit={handleAddMetric} className="p-6 min-w-[400px]">

            <div className="space-y-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-[#D9D9D9] mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="weight"
                  name="weight"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                  placeholder="Enter weight"
                />
              </div>
              <div>
                <label htmlFor="muscleMass" className="block text-sm font-medium text-[#D9D9D9] mb-1">
                  Skeletal Muscle Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="muscleMass"
                  name="muscleMass"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                  placeholder="Enter muscle mass"
                />
              </div>
              <div>
                <label htmlFor="bodyFat" className="block text-sm font-medium text-[#D9D9D9] mb-1">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="bodyFat"
                  name="bodyFat"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                  placeholder="Enter body fat percentage"
                />
              </div>
            </div>
            {inputError && (
              <p className="text-[#D8110A] text-sm mt-2">{inputError}</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  dialogRef.current?.close()
                  setInputError(null)
                  formRef.current?.reset()
                }}
                className="px-4 py-2 text-[#D9D9D9] hover:bg-[#1a1a1a] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
} 