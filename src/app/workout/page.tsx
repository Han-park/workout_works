'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, MagicWandIcon, TrashIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Exercise {
  id: number
  created_at: string
  exercise_name: string
  brand_name: string
  is_freeweight: boolean
  content: string
  total_volume: number
  target_muscle_group: string
  UID?: string
  recognition_date?: string
}

export default function WorkoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [inputError, setInputError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [calculatingVolume, setCalculatingVolume] = useState(false)
  const [volumeResult, setVolumeResult] = useState<number | null>(null)
  const [volumeEquation, setVolumeEquation] = useState<string | null>(null)
  const [isFreeweight, setIsFreeweight] = useState(false)
  const [predictingMuscleGroup, setPredictingMuscleGroup] = useState(false)
  const [predictedMuscleGroup, setPredictedMuscleGroup] = useState<string>('')
  const [lastPredictedName, setLastPredictedName] = useState<string>('')
  const [exerciseName, setExerciseName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [totalVolume, setTotalVolume] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [muscleGroups] = useState([
    'chest', 'back', 'legs', 'shoulder', 'biceps', 'triceps', 'abs', 'cardio', 'full body'
  ])
  const [deletingExercise, setDeletingExercise] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    async function fetchData() {
      try {
        setLoading(true)
        // Format the date to YYYY-MM-DD for comparison
        const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0]
        
        // Fetch exercises for the current user and selected date
        // We'll compare the date part of created_at with the selected date
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercise')
          .select('*')
          .eq('UID', user?.id || '')
          .filter('created_at', 'gte', `${selectedDateStr}T00:00:00`)
          .filter('created_at', 'lte', `${selectedDateStr}T23:59:59.999999`)
          .order('created_at', { ascending: false })

        if (exerciseError) throw exerciseError
        setExercises(exerciseData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, user, router])

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setVolumeResult(null)
    setVolumeEquation(null)
  }

  const handleFreeweightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFreeweight(e.target.checked)
  }

  // Wrap predictMuscleGroup in useCallback
  const predictMuscleGroup = useCallback(async (exerciseName: string) => {
    if (!exerciseName || exerciseName.trim() === '') return
    
    setPredictingMuscleGroup(true)
    
    try {
      const response = await fetch('/api/predict-muscle-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseName: exerciseName,
          muscleGroups: muscleGroups
        }),
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to predict muscle group')
      }
      
      if (data.muscleGroup) {
        setPredictedMuscleGroup(data.muscleGroup)
      } else {
        setPredictedMuscleGroup('')
      }
    } catch (error) {
      console.error('Error predicting muscle group:', error)
      setPredictedMuscleGroup('')
    } finally {
      setPredictingMuscleGroup(false)
    }
  }, [muscleGroups]) // Add dependencies

  // Load saved form data from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFormData = localStorage.getItem('workoutFormData')
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData)
          setExerciseName(parsedData.exerciseName || '')
          setBrandName(parsedData.brandName || '')
          setContent(parsedData.content || '')
          setTotalVolume(parsedData.totalVolume || '')
          setIsFreeweight(parsedData.isFreeweight || false)
          setPredictedMuscleGroup(parsedData.predictedMuscleGroup || '')
          
          // If we have a saved exercise name and it's different from the last predicted one,
          // we should trigger muscle group prediction
          if (parsedData.exerciseName && parsedData.exerciseName !== lastPredictedName) {
            setLastPredictedName(parsedData.exerciseName)
            predictMuscleGroup(parsedData.exerciseName)
          }
        } catch (error) {
          console.error('Error parsing saved form data:', error)
          // Clear invalid data
          localStorage.removeItem('workoutFormData')
        }
      }
    }
  }, [lastPredictedName, predictMuscleGroup])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const formData = {
        exerciseName: exerciseName,
        brandName: brandName,
        content: content,
        totalVolume: totalVolume,
        isFreeweight: isFreeweight,
        predictedMuscleGroup: predictedMuscleGroup
      }
      localStorage.setItem('workoutFormData', JSON.stringify(formData))
    }
  }, [exerciseName, brandName, content, totalVolume, isFreeweight, predictedMuscleGroup])

  const handleExerciseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setExerciseName(name)
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Only predict if:
    // 1. Name is long enough
    // 2. Not already predicting
    // 3. Name has changed significantly from last prediction (at least 3 characters different)
    const shouldPredict = 
      name.length > 3 && 
      !predictingMuscleGroup && 
      (lastPredictedName === '' || Math.abs(name.length - lastPredictedName.length) > 2 || !name.includes(lastPredictedName.substring(0, 3)));
    
    if (shouldPredict) {
      // Set a longer debounce time to reduce API calls
      debounceTimerRef.current = setTimeout(() => {
        setLastPredictedName(name);
        predictMuscleGroup(name);
      }, 800) // Increased from 500ms to 800ms
    }
  }

  const handleBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandName(e.target.value)
  }
  
  const handleTotalVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalVolume(e.target.value)
  }

  const calculateVolume = async () => {
    if (!content) return
    
    setCalculatingVolume(true)
    setInputError(null)
    setVolumeEquation(null)
    
    try {
      const response = await fetch('/api/calculate-volume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          instruction: "Calculate the total volume in kilograms based on the exercise details. Convert any weights in pounds (lbs or l) to kilograms (kg or k) using the conversion 1 lb = 0.453592 kg. For each line, multiply weight × sets × reps. If 'each' is specified, multiply the weight by 2. Return your answer in this format: 'Equation: [detailed calculation equation] = [total]kg\nResult: [total]'"
        }),
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate total volume')
      }
      
      const totalVolume = parseFloat(data.volume)
      
      if (isNaN(totalVolume) || totalVolume < 0) {
        throw new Error('Invalid volume calculation received')
      }

      const roundedVolume = Math.round(totalVolume)
      setVolumeResult(roundedVolume)
      
      // Update the state with the calculated volume
      setTotalVolume(roundedVolume.toString())
      
      if (data.equation) {
        setVolumeEquation(data.equation)
      }
      
      // No need to manually set the input value since we're updating the state
      // and the input is controlled by the state via the value={totalVolume} prop
    } catch (error: unknown) {
      setInputError(error instanceof Error ? error.message : 'Failed to calculate total volume')
      console.error('Error calculating volume:', error instanceof Error ? error.message : error)
    } finally {
      setCalculatingVolume(false)
    }
  }

  const handleAddExercise = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInputError(null)

    if (!user) {
      setInputError('You must be logged in to add an exercise')
      return
    }

    // Validate inputs
    if (!exerciseName || !content || !predictedMuscleGroup) {
      setInputError('Please fill in all required fields (exercise name, content, and target muscle group)')
      return
    }

    try {
      // Create a date object with the selected date but current time
      const now = new Date()
      const recordDate = new Date(selectedDate)
      recordDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      
      const { data, error: insertError } = await supabase
        .from('exercise')
        .insert([{
          created_at: recordDate.toISOString(),
          exercise_name: exerciseName,
          brand_name: brandName || null,
          is_freeweight: isFreeweight,
          content: content,
          total_volume: totalVolume ? Number(totalVolume) : null,
          target_muscle_group: predictedMuscleGroup,
          UID: user.id
        }])
        .select()

      if (insertError) throw insertError

      setExercises((prev: Exercise[]) => [data[0], ...prev])
      formRef.current?.reset()
      
      // Clear form data from state and localStorage after successful submission
      setContent('')
      setExerciseName('')
      setBrandName('')
      setTotalVolume('')
      setVolumeResult(null)
      setVolumeEquation(null)
      setIsFreeweight(false)
      setPredictedMuscleGroup('')
      setLastPredictedName('')
      localStorage.removeItem('workoutFormData')
    } catch (error: unknown) {
      setInputError(error instanceof Error ? error.message : 'Failed to add exercise')
    }
  }

  // Group exercises by muscle group for the summary
  const exercisesByMuscleGroup = exercises.reduce((acc: Record<string, number>, exercise) => {
    const group = exercise.target_muscle_group || 'other'
    acc[group] = (acc[group] || 0) + 1
    return acc
  }, {})

  // Add this new function to handle exercise deletion
  const handleDeleteExercise = async (exerciseId: number) => {
    if (!user) return
    
    try {
      setDeletingExercise(exerciseId)
      
      const { error } = await supabase
        .from('exercise')
        .delete()
        .eq('id', exerciseId)
        .eq('UID', user.id)
      
      if (error) throw error
      
      // Remove the exercise from the state
      setExercises(prev => prev.filter(exercise => exercise.id !== exerciseId))
    } catch (error) {
      console.error('Error deleting exercise:', error)
      setInputError('Failed to delete exercise')
    } finally {
      setDeletingExercise(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-white/50">Loading workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      {/* Date Carousel */}
      <div className="p-4 flex items-center justify-center gap-4 bg-[#111111] border-b border-gray-800">
        <button
          onClick={() => handleDateChange(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <p className="text-lg font-light">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
        <button
          onClick={() => handleDateChange(1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Summary */}
        <div className="bg-[#111111] p-4 rounded-lg border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-white/90">Workout Summary</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-md">
              <p className="text-sm text-white/50 mb-1">Total Exercises</p>
              <p className="text-2xl font-medium text-[#D8110A]">{exercises.length}</p>
            </div>
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-md">
              <p className="text-sm text-white/50 mb-1">Total Volume</p>
              <p className="text-2xl font-medium text-white">
                {exercises.reduce((sum, exercise) => sum + (exercise.total_volume || 0), 0)}kg
              </p>
            </div>
          </div>
          
          {/* Muscle Groups Summary */}
          {Object.keys(exercisesByMuscleGroup).length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(exercisesByMuscleGroup).map(([group, count]) => (
                <div key={group} className="bg-[#1a1a1a] p-2 rounded-md flex justify-between items-center">
                  <span className="text-sm text-white/70 capitalize">{group}</span>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Exercise Form */}
        <form ref={formRef} onSubmit={handleAddExercise} className="bg-[#111111] p-4 rounded-lg border border-gray-800">
          <div className="flex flex-col gap-3">
            {/* Row 1: Exercise Name and Muscle Group */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="exerciseName"
                  placeholder="Exercise name (e.g. Bench Press, Squat)"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                  onChange={handleExerciseNameChange}
                  value={exerciseName}
                />
                {predictingMuscleGroup && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">
                    Predicting...
                  </div>
                )}
              </div>
              
              {predictedMuscleGroup && !predictingMuscleGroup && (
                <div className="px-3 py-2 rounded-md text-white flex items-center gap-2">
                  <span className="text-sm text-[#D8110A] capitalize">{predictedMuscleGroup}</span>
                  <input type="hidden" name="targetMuscleGroup" value={predictedMuscleGroup} />
                </div>
              )}
              {!predictedMuscleGroup && !predictingMuscleGroup && (
                <div className="px-3 py-2  rounded-md text-white/50 text-sm">
                  ---
                </div>
              )}
            </div>
            
            {/* Row 2: Brand Name and Free Weight Checkbox */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                name="brandName"
                placeholder="Brand name (optional)"
                disabled={isFreeweight}
                className={`flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A] ${isFreeweight ? 'opacity-50 cursor-not-allowed' : ''}`}
                onChange={handleBrandNameChange}
                value={brandName}
              />
              
              <label className="w-1/3 text-white/70 text-sm flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md">
                <input
                  type="checkbox"
                  name="isFreeweight"
                  checked={isFreeweight}
                  onChange={handleFreeweightChange}
                  value="true"
                  className="rounded bg-[#1a1a1a] border-gray-800 text-[#D8110A] focus:ring-[#D8110A]"
                />
                Free weight
              </label>
            </div>
            
            {/* Row 3: Exercise Details */}
            <textarea
              name="content"
              placeholder="Exercise details (e.g. '- 20k: 12, 10, 8 reps' or '22k each: 12, 12, 15')"
              rows={5}
              value={content}
              onChange={handleContentChange}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
            ></textarea>
            
            {/* Row 4: Total Volume and Magic Wand */}
            <div className="flex gap-2">
              <input
                type="number"
                name="totalVolume"
                placeholder="Total volume (kg)"
                min="0"
                className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onChange={handleTotalVolumeChange}
                value={totalVolume}
              />
              <button
                type="button"
                onClick={calculateVolume}
                disabled={!content || calculatingVolume}
                className="px-4 py-2 bg-[#D8110A] border border-gray-800 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors"
              >
                <MagicWandIcon className="w-5 h-5" />
              </button>
            </div>
            
            {calculatingVolume && (
              <div className="text-sm text-white/50 text-center">
                Calculating total volume...
              </div>
            )}
            {volumeResult !== null && !calculatingVolume && (
              <div className="space-y-1">
                <div className="text-sm text-[#D8110A] text-center">
                  Calculated total volume: {volumeResult}kg
                </div>
                {volumeEquation && (
                  <div className="text-xs text-white/50 bg-[#1a1a1a] p-2 rounded-md overflow-auto max-h-24 whitespace-pre-wrap">
                    <code>{volumeEquation}</code>
                  </div>
                )}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full py-2 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Exercise</span>
            </button>
          </div>
          {inputError && (
            <p className="text-[#D8110A] text-sm mt-2">{inputError}</p>
          )}
        </form>

        {/* Exercise List */}
        <div className="space-y-2">
          {exercises.length === 0 ? (
            <div className="bg-[#111111] p-4 rounded-lg border border-gray-800 text-center">
              <p className="text-white/50">No exercises recorded for this day</p>
            </div>
          ) : (
            exercises.map((exercise: Exercise) => (
              <div
                key={exercise.id}
                className="bg-[#111111] p-4 rounded-lg border border-gray-800 overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="font-medium text-white/90 truncate">{exercise.exercise_name}</h3>
                    <p className="text-xs text-white/50 mt-0.5 truncate">
                      {exercise.is_freeweight ? 'Free weight' : exercise.brand_name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-sm text-white/30">
                      {new Date(exercise.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span className="text-xs text-[#D8110A] mt-0.5 capitalize">
                      {exercise.target_muscle_group}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#1a1a1a] p-2 rounded-md mt-2 overflow-x-auto">
                  <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono break-words">
                    {exercise.content}
                  </pre>
                </div>
                
                <div className="flex justify-between mt-2 items-center">
                  {exercise.total_volume && (
                    <span className="text-xs text-[#9ACD32] truncate">Total volume: {exercise.total_volume}kg</span>
                  )}
                  <button
                    onClick={() => handleDeleteExercise(exercise.id)}
                    disabled={deletingExercise === exercise.id}
                    className={`p-1.5 rounded-full hover:bg-[#2a2a2a] transition-colors flex-shrink-0 ${deletingExercise === exercise.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Delete exercise"
                  >
                    <TrashIcon className="w-4 h-4 text-[#D8110A]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 