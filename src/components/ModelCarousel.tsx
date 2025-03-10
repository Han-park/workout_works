'use client'

import { useState } from 'react'
import GlbModelViewer from './GlbModelViewer'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

type ModelItem = {
  url: string;
  name: string;
  description?: string;
}

type ModelCarouselProps = {
  models: ModelItem[];
  height?: number;
}

export default function ModelCarousel({ models, height = 300 }: ModelCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const goToPrevious = () => {
    const isFirstModel = currentIndex === 0
    const newIndex = isFirstModel ? models.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }
  
  const goToNext = () => {
    const isLastModel = currentIndex === models.length - 1
    const newIndex = isLastModel ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
  }
  
  if (models.length === 0) {
    return (
      <div 
        className="bg-[#222222] rounded-lg flex items-center justify-center text-gray-400"
        style={{ height }}
      >
        No models available
      </div>
    )
  }
  
  const currentModel = models[currentIndex]
  
  return (
    <div className="relative">
      <GlbModelViewer url={currentModel.url} height={height} />
      
      {/* Navigation arrows */}
      {models.length > 1 && (
        <>
          <button 
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            aria-label="Previous model"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            aria-label="Next model"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      )}
      
      {/* Model name and indicator */}
      <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
        <div className="bg-black/60 px-3 py-1 rounded-full text-white text-sm">
          {currentModel.name}
        </div>
        
        {models.length > 1 && (
          <div className="flex mt-2 gap-1">
            {models.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-white/30'}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 