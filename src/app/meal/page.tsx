'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@radix-ui/react-icons'

interface Food {
  id: number
  created_at: string
  food_name: string
  weight: number
  protein_content: number
  is_creatine: boolean
}

export default function MealPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [inputError, setInputError] = useState<string | null>(null)
  const [isCreatine, setIsCreatine] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true)
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error: fetchError } = await supabase
        .from('meal')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setFoods(data || [])
    } catch (err) {
      console.error('Failed to fetch foods:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchFoods()
  }, [fetchFoods])

  // Calculate total protein for the selected date
  const totalProtein = foods
    .filter(food => {
      const foodDate = new Date(food.created_at)
      return foodDate.toDateString() === selectedDate.toDateString()
    })
    .reduce((sum, food) => sum + food.protein_content, 0)

  // Check if creatine was taken on the selected date
  const creatineTaken = foods.some(food => 
    food.is_creatine && 
    new Date(food.created_at).toDateString() === selectedDate.toDateString()
  )

  const handleAddFood = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInputError(null)

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
      const { data, error: insertError } = await supabase
        .from('meal')
        .insert([{
          created_at: new Date().toISOString(),
          food_name: foodName,
          weight: isCreatine ? 5 : Number(weight),
          protein_content: isCreatine ? 0 : Number(proteinContent),
          is_creatine: isCreatine
        }])
        .select()

      if (insertError) throw insertError

      setFoods(prev => [data[0], ...prev])
      formRef.current?.reset()
      setIsCreatine(false) // Reset the creatine state after successful submission
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Failed to add food')
    }
  }

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim()
    setIsCreatine(value === 'creatine')
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
            <span className="text-sm text-white/50">Goal: 160g of protein</span>
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
        </div>

        {/* Add Food Form */}
        <form ref={formRef} onSubmit={handleAddFood} className="bg-[#111111] p-4 rounded-lg border border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              name="foodName"
              placeholder="Food name (or type 'creatine')"
              onChange={handleFoodNameChange}
              className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
            />
            {isCreatine ? (
              <div className="w-24 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white/50">
                5g
              </div>
            ) : (
              <input
                type="number"
                name="weight"
                placeholder="Total (g)"
                step="0.1"
                className="w-24 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
            {isCreatine ? (
              <div className="w-28 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white/50">
                0g
              </div>
            ) : (
              <input
                type="number"
                name="proteinContent"
                placeholder="Protein (g)"
                step="0.1"
                className="w-28 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
            <button
              type="submit"
              className="p-2 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          {inputError && (
            <p className="text-[#D8110A] text-sm mt-2">{inputError}</p>
          )}
        </form>

        {/* Food List */}
        <div className="space-y-2">
          {foods.map(food => (
            <div
              key={food.id}
              className="bg-[#111111] p-4 rounded-lg border border-gray-800 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-white/90">{food.food_name}</h3>
                <p className="text-sm text-white/50">
                  {food.weight}g
                  {!food.is_creatine && ` • ${food.protein_content}g protein`}
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