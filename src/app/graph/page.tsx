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
  Legend
} from 'chart.js'
import BodyCompositionChart from '@/components/BodyCompositionChart'
import ProteinIntakeChart from '@/components/ProteinIntakeChart'
import WorkoutVolumeChart from '@/components/WorkoutVolumeChart'

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

interface VolumeData {
  date: string
  total: number
}

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
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
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
      
      setProteinData(proteinDataArray);
    } catch (err) {
      console.error('Error fetching protein data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch protein data');
    }
  }, [user]);

  const fetchVolumeData = useCallback(async (weekDate: Date) => {
    try {
      const { monday, sunday } = getWeekDates(weekDate);
      
      const response = await fetch(
        `/api/workout-volume?userId=${user?.id || ''}&startDate=${formatDateForDB(monday)}&endDate=${formatDateForDB(sunday)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch workout volume data');
      }
      
      const data = await response.json();
      setVolumeData(data.volumeData || []);
    } catch (err) {
      console.error('Error fetching workout volume data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workout volume data');
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
        
        // Fetch workout volume data for the current week
        await fetchVolumeData(currentWeek);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router, currentWeek, fetchProteinData, fetchVolumeData])

  const handleWeekChange = (weeks: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setCurrentWeek(newDate);
    // Force chart to reinitialize with new data
    ChartJS.unregister(CategoryScale);
    ChartJS.register(CategoryScale);
  };

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
  const dateRangeText = `${monday.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header onAddClick={() => dialogRef.current?.showModal()} />
      <div className="p-4 gap-2">
        <BodyCompositionChart metrics={metrics} goals={goals} />
        <div className="mt-8 bg-[#111111] rounded-lg shadow-2xl border border-gray-800">
          <ProteinIntakeChart 
            proteinData={proteinData}
            proteinGoal={proteinGoal}
            currentWeek={currentWeek}
            dateRangeText={dateRangeText}
            onWeekChange={handleWeekChange}
          />

          <WorkoutVolumeChart 
            volumeData={volumeData}
            currentWeek={currentWeek}
            dateRangeText={dateRangeText}
            onWeekChange={handleWeekChange}
          />
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