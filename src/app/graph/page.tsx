'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type LegendItem
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Metric {
  id: number
  created_at: string
  skeletal_muscle_mass: number
  percent_body_fat: number
}

const GOALS = {
  muscle_mass: 43,
  body_fat: 12
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

export default function GraphPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data, error } = await supabase
          .from('metric')
          .select('*')
        
        if (error) {
          throw error
        }

        // Sort the data by created_at
        const sortedData = [...(data || [])].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setMetrics(sortedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

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
        data: Array(metrics.length).fill(GOALS.muscle_mass),
        borderColor: COLORS.primary,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
        yAxisID: 'y',
        tension: 0,
      },
      {
        label: 'Body Fat Goal',
        data: Array(metrics.length).fill(GOALS.body_fat),
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

  const handleAddMetric = async (e: React.FormEvent<HTMLFormElement>) => {

    
    e.preventDefault()
    setInputError(null)

    const formData = new FormData(e.currentTarget)
    const muscleMass = formData.get('muscleMass')
    const bodyFat = formData.get('bodyFat')
    const creatineTaken = formData.get('creatineTaken')
    
    // Validate inputs
    if (!muscleMass || !bodyFat || !creatineTaken) {
      setInputError('Please fill in all fields')
      return
    }

    const muscleValue = parseFloat(muscleMass as string)
    const fatValue = parseFloat(bodyFat as string)

    if (isNaN(muscleValue) || isNaN(fatValue)) {
      setInputError('Please enter valid numbers')
      return
    }

    try {
      const { data, error: insertError } = await supabase
        .from('metric')
        .insert([
          {
            created_at: new Date().toISOString(),
            skeletal_muscle_mass: muscleValue,
            percent_body_fat: fatValue
          }
        ])
        .select()

      if (insertError) throw insertError

      console.log(data); // Log the added metric data
      console.log(creatineTaken); // Log the creatineTaken value

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
      
      console.log("now the error occured. the data is:", { muscleValue, fatValue }); // Log the input values when an error occurs
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

  return (
    
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header onAddClick={() => dialogRef.current?.showModal()} />
      <div className="flex-1 p-8">
        <div className="bg-[#111111] rounded-lg shadow-2xl p-6 border border-gray-800">
          <div className="w-full h-[400px]">
            <Line options={options} data={chartData} />
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#D8110A]">
                    {GOALS.muscle_mass}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {GOALS.body_fat}
                  </td>
                </tr>
                {metrics.map((metric, index) => (
                  <tr key={metric.id} className={index % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#111111]'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D9D9D9]">
                      {new Date(metric.created_at).toLocaleDateString()}
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
          <form ref={formRef} onSubmit={handleAddMetric} className="space-y-4">
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