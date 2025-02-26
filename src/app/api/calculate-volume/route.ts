import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { content, instruction } = await request.json()

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Exercise details are required' },
        { status: 400 }
      )
    }

    // Proceed directly with volume calculation without validation
    const updatedInstruction = "Calculate the total volume in kilograms based on the exercise details. Convert any weights in pounds (lbs or l) to kilograms (kg or k) using the conversion 1 lb = 0.453592 kg. For each line, multiply weight × sets × reps. If 'each' is specified, multiply the weight by 2. Return your answer in this format: 'Equation: [detailed calculation equation] = [total]kg\nResult: [total]'"
    const prompt = `${content}\n\n${updatedInstruction}`

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a fitness expert specialized in calculating total volume for exercises. You must show your work by providing the detailed equation and the final result.

Make sure to convert any weights in pounds (lbs or l) to kilograms using the conversion 1 lb = 0.45 kg. 

Here are examples of how to calculate volume correctly:

Example 1:
"22k each: 12, 12, 15"
Equation: 22 * 2(each) * 12 + 22 * 2 * 12 + 22 * 2 * 15 = 1716kg
Result: 1716

Example 2:
"- 23k: 15
- 27k: 15, 15
- 14k: 20"
Equation: 23 * 1 * 15 + 27 * 1 * 15 + 27 * 1 * 15 + 14 * 1 * 20 = 1145kg
Result: 1145

For each exercise set, multiply weight × number of sets × reps. If 'each' is specified, multiply the weight by 2 first. Sum all calculations for the total volume.

Always format your answer exactly like the examples above with "Equation:" followed by the calculation and "Result:" followed by just the number.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.1,
    })

    const response = completion.choices[0].message.content?.trim() || ''
    
    // Parse the response to extract equation and result
    let equation = ''
    let volume = ''
    
    // Split the response by lines and process it
    const lines = response.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('Equation:')) {
        // Collect all lines until we hit "Result:" or end of text
        let equationText = line.substring('Equation:'.length).trim()
        let j = i + 1
        while (j < lines.length && !lines[j].startsWith('Result:')) {
          equationText += ' ' + lines[j].trim()
          j++
        }
        equation = equationText
      } else if (line.startsWith('Result:')) {
        const resultText = line.substring('Result:'.length).trim()
        const numberMatch = resultText.match(/\d+/)
        if (numberMatch) {
          volume = numberMatch[0]
        }
      }
    }
    
    // If we couldn't find a properly formatted result, try to extract any number
    if (!volume) {
      const numberMatch = response.match(/\d+/)
      if (numberMatch) {
        volume = numberMatch[0]
      }
    }
    
    if (!volume) {
      throw new Error('Failed to extract volume calculation')
    }

    return NextResponse.json({ volume, equation })
  } catch (error) {
    console.error('Error calculating total volume:', error)
    return NextResponse.json(
      { error: 'Failed to calculate total volume' },
      { status: 500 }
    )
  }
} 