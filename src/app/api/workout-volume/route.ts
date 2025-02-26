import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, startDate, endDate' },
        { status: 400 }
      )
    }

    // Fetch exercises for the date range
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercise')
      .select('created_at, total_volume')
      .eq('UID', userId)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59.999999`)
      .order('created_at', { ascending: true })

    if (exerciseError) {
      throw exerciseError
    }

    // Process data to get daily totals
    const dailyTotals: Record<string, number> = {}
    
    // Initialize all days in the range with 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    for (let i = 0; i < dayDiff; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      const dateStr = day.toISOString().split('T')[0]
      dailyTotals[dateStr] = 0
    }
    
    // Sum volume by day
    exerciseData?.forEach(exercise => {
      if (exercise.total_volume) {
        const date = new Date(exercise.created_at).toISOString().split('T')[0]
        dailyTotals[date] = (dailyTotals[date] || 0) + exercise.total_volume
      }
    })
    
    // Convert to array format for chart
    const volumeData = Object.entries(dailyTotals).map(([date, total]) => ({
      date,
      total
    }))
    
    return NextResponse.json({ volumeData })
  } catch (error) {
    console.error('Error fetching workout volume data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout volume data' },
      { status: 500 }
    )
  }
} 