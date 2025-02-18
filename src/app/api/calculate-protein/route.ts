import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { food, weight, instruction } = await request.json()

    // First, validate if the input is a food
    const validationCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a nutritionist. Your task is to determine if the given input is a valid food item. Respond with 'true' if it's a food, and 'false' if it's not a food. Only respond with 'true' or 'false', nothing else."
        },
        {
          role: "user",
          content: `Is '${food}' a food item?`
        }
      ],
      model: "gpt-4o-mini",
    })

    const isFood = validationCompletion.choices[0].message.content?.trim().toLowerCase() === 'true'

    if (!isFood) {
      return NextResponse.json(
        { error: 'This does not appear to be a valid food item' },
        { status: 400 }
      )
    }

    // If it is a food, proceed with protein calculation
    const prompt = `Calculate the protein content in ${weight}g of ${food}. ${instruction}`

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a nutritionist specialized in calculating protein content in foods. Always return just the number representing grams of protein, without any units or text. If given a range, calculate the average. For example, if the protein content is between 22-24g, return 23."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini",
    })

    const protein = completion.choices[0].message.content?.trim()

    return NextResponse.json({ protein })
  } catch (error) {
    console.error('Error calculating protein content:', error)
    return NextResponse.json(
      { error: 'Failed to calculate protein content' },
      { status: 500 }
    )
  }
} 