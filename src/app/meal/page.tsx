'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, MagicWandIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Food {
  id: number
  created_at: string
  recognition_date: string
  food_name: string
  weight: number
  protein_content: number
  creatine: boolean
  UID: string
}

export default function MealPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [inputError, setInputError] = useState<string | null>(null)
  const [isCreatine, setIsCreatine] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [weight, setWeight] = useState('')
  const [calculatingProtein, setCalculatingProtein] = useState(false)
  const [proteinResult, setProteinResult] = useState<number | null>(null)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    async function fetchData() {
      try {
        setLoading(true)
        // Fetch latest weight for the current user
        const { data: weightData, error: weightError } = await supabase
          .from('metric')
          .select('weight')
          .eq('UID', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(1)

        if (weightError) throw weightError

        if (weightData && weightData.length > 0 && weightData[0].weight) {
          setLatestWeight(weightData[0].weight)
        }

        // Fetch foods for the current user
        const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0]
        const { data: foodData, error: foodError } = await supabase
          .from('meal')
          .select('*')
          .eq('UID', user?.id || '')
          .eq('recognition_date', selectedDateStr)
          .order('created_at', { ascending: false })

        if (foodError) throw foodError
        setFoods(foodData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, user, router])
  
  // Derived values
  const totalProtein = foods.reduce((sum: number, food: Food) => sum + food.protein_content, 0)
  const proteinGoal = latestWeight ? Math.round(latestWeight * 2) : 160
  const creatineTaken = foods.some((food: Food) => food.creatine)
  
  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim()
    setFoodName(value)
    setIsCreatine(value === 'creatine')
    setProteinResult(null)
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value)
    setProteinResult(null)
  }

  const handleAddFood = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInputError(null)

    if (!user) {
      setInputError('You must be logged in to add food')
      return
    }

    const formData = new FormData(e.currentTarget)
    const foodName = formData.get('foodName') as string
    const weight = formData.get('weight')
    const proteinContent = formData.get('proteinContent')

    // Handle creatine case
    const isCreatine = foodName.toLowerCase().trim() === 'creatine'
    if (isCreatine) {
      if (creatineTaken) {
        setInputError('Creatine has already been logged for today')
        return
      }
    } else {
      // Validate regular food inputs
      if (!foodName || !weight || !proteinContent) {
        setInputError('Please fill in all fields')
        return
      }
    }

    try {
      // Use only the date part of selectedDate for recognition_date
      const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0]

      const { data, error: insertError } = await supabase
        .from('meal')
        .insert([{
          created_at: new Date().toISOString(),
          recognition_date: selectedDateStr,
          food_name: foodName,
          weight: isCreatine ? 5 : Number(weight),
          protein_content: isCreatine ? 0 : Number(proteinContent),
          creatine: isCreatine,
          UID: user.id
        }])
        .select()

      if (insertError) throw insertError

      setFoods((prev: Food[]) => [data[0], ...prev])
      formRef.current?.reset()
      setIsCreatine(false)
    } catch (error: unknown) {
      setInputError(error instanceof Error ? error.message : 'Failed to add food')
    }
  }

  const calculateProtein = async () => {
    if (!foodName || !weight) return
    
    setCalculatingProtein(true)
    setInputError(null)
    
    try {
      const response = await fetch('/api/calculate-protein', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food: foodName,
          weight: parseFloat(weight),
          instruction: "Please calculate the average protein content in grams. If a range is given, take the average. Return ONLY the number without any text or units."
        }),
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate protein content')
      }
      
      const proteinContent = parseFloat(data.protein)
      
      if (isNaN(proteinContent) || proteinContent < 0) {
        throw new Error('Invalid protein content received')
      }

      setProteinResult(proteinContent)
      
      // Set the protein input value
      const proteinInput = formRef.current?.querySelector('input[name="proteinContent"]') as HTMLInputElement
      if (proteinInput) {
        proteinInput.value = proteinContent.toString()
      }
    } catch (error: unknown) {
      setInputError(error instanceof Error ? error.message : 'Failed to calculate protein content')
      console.error('Error calculating protein:', error instanceof Error ? error.message : error)
    } finally {
      setCalculatingProtein(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-white/50">Loading meals...</p>
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
            <h2 className="text-lg font-medium text-white/90">Daily Summary</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Goal: {proteinGoal}g of protein</span>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      className="text-white/50 hover:text-white transition-colors"
                      aria-label="Show protein goal calculation info"
                    >
                      <InfoCircledIcon className="w-4 h-4" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="select-none rounded-md bg-[#1a1a1a] px-4 py-2.5 text-sm text-white/70 shadow-lg border border-gray-800 max-w-[300px]"
                      sideOffset={5}
                    >
                      To gain muscles, you need 2 grams of protein per kilogram of your body weight.
                      Your current weight is {latestWeight ? `${latestWeight}kg, so your protein goal is ${proteinGoal}g` : 'not set, using default goal of 160g'}.
                      <Tooltip.Arrow className="fill-[#1a1a1a]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          </div>
        
          
          <div className="flex gap-4">
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-md">
              <p className="text-sm text-white/50 mb-1">Total Protein</p>
              <p className="text-2xl font-medium text-[#D8110A]">{totalProtein}g</p>
            </div>
            <div className="flex-1 bg-[#1a1a1a] p-3 rounded-md">
              <p className="text-sm text-white/50 mb-1">Creatine</p>
              <p className="text-2xl font-medium text-white text-left">
                {creatineTaken ? '✅' : '😵'}
              </p>
            </div>
          </div>
    

        {/* Protein Progress Bar */}
        <div className="mt-4">
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${totalProtein >= proteinGoal ? 'bg-green-500' : 'bg-[#D8110A]'} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(100, (totalProtein / proteinGoal) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-white/30">
              <span>{totalProtein}g</span>
              <span>{Math.round((totalProtein / proteinGoal) * 100)}%</span>
              <span>{proteinGoal}g</span>
            </div>
            
          </div>

          </div>

        {/* Add Food Form */}
        <form ref={formRef} onSubmit={handleAddFood} className="bg-[#111111] p-4 rounded-lg border border-gray-800">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              name="foodName"
              placeholder="Food name (or type 'creatine')"
              onChange={handleFoodNameChange}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
            />
            <div className="flex gap-2 items-center">
              {isCreatine ? (
                <div className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white/50">
                  5g
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    name="weight"
                    placeholder="Total (g)"
                    step="0.1"
                    onChange={handleWeightChange}
                    className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={calculateProtein}
                    disabled={!foodName || !weight || calculatingProtein}
                    className="pl-3 pr-4 py-2 bg-[#D8110A] border border-gray-800 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors"
                  >
                    <MagicWandIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {calculatingProtein && (
              <div className="text-sm text-white/50 text-center">
                Calculating protein content...
              </div>
            )}
            {proteinResult !== null && !calculatingProtein && (
              <div className="text-sm text-[#D8110A] text-center">
                Estimated protein content: {proteinResult}g
              </div>
            )}
            {isCreatine ? (
              <div className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white/50">
                0g
              </div>
            ) : (
              <input
                type="number"
                name="proteinContent"
                placeholder="Protein (g)"
                step="0.1"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
            <button
              type="submit"
              className="w-full py-2 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Food</span>
            </button>
          </div>
          {inputError && (
            <p className="text-[#D8110A] text-sm mt-2">{inputError}</p>
          )}
        </form>

        {/* Food List */}
        <div className="space-y-2">
          {foods.map((food: Food) => (
            <div
              key={food.id}
              className="bg-[#111111] p-4 rounded-lg border border-gray-800 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-white/90">{food.food_name}</h3>
                <p className="text-sm text-white/50">
                  {food.weight}g
                  {!food.creatine && ` • ${food.protein_content}g protein`}
                </p>
              </div>
              <span className="text-sm text-white/30">
                {new Date(food.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 