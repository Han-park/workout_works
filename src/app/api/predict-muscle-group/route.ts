import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { exerciseName, muscleGroups } = await request.json()

    if (!exerciseName || exerciseName.trim() === '') {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      )
    }

    if (!muscleGroups || !Array.isArray(muscleGroups) || muscleGroups.length === 0) {
      return NextResponse.json(
        { error: 'Valid muscle groups array is required' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a fitness expert. Your task is to determine the primary target muscle group for a given exercise.
          
Choose from ONLY these muscle groups: ${muscleGroups.join(', ')}.

Respond with ONLY the name of the muscle group, in lowercase, nothing else. For example, if the exercise is "bench press", respond with "chest".

If you're unsure or the exercise targets multiple muscle groups equally, choose the most commonly associated primary muscle group.`
        },
        {
          role: "user",
          content: `What is the primary target muscle group for "${exerciseName}"?`
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.3,
    })

    const muscleGroup = completion.choices[0].message.content?.trim().toLowerCase() || ''
    
    // Validate that the response is one of the allowed muscle groups
    if (!muscleGroups.includes(muscleGroup)) {
      console.warn(`Model returned invalid muscle group: "${muscleGroup}" for exercise "${exerciseName}"`)
      return NextResponse.json({ muscleGroup: null })
    }

    return NextResponse.json({ muscleGroup })
  } catch (error) {
    console.error('Error predicting muscle group:', error)
    return NextResponse.json(
      { error: 'Failed to predict muscle group' },
      { status: 500 }
    )
  }
} 