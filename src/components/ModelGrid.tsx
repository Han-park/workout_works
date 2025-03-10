'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ReloadIcon, InfoCircledIcon } from '@radix-ui/react-icons'

// Dynamically import the GlbModelViewer to avoid SSR issues
const GlbModelViewer = dynamic(() => import('./GlbModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[200px] bg-[#222222] rounded-lg">
      <div className="animate-spin text-[#D8110A]">
        <ReloadIcon className="w-6 h-6" />
      </div>
    </div>
  )
})

// Define a type for rotation configuration
type RotationConfig = {
  x?: number;
  y?: number;
  z?: number;
}

type ModelItem = {
  url: string;
  name: string;
  description?: string;
  rotationAxis?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';
  rotationSpeed?: number;
  rotationConfig?: RotationConfig;
}

type ModelGridProps = {
  models: ModelItem[];
  itemHeight?: number;
}

export default function ModelGrid({ models, itemHeight = 200 }: ModelGridProps) {
  if (models.length === 0) {
    return (
      <div 
        className="bg-[#222222] rounded-lg flex items-center justify-center text-gray-400 p-4"
        style={{ height: itemHeight }}
      >
        No models available
      </div>
    )
  }
  
  // Assign default rotation properties if not provided
  const modelsWithDefaults = models.map((model, index) => {
    // If no rotation properties are specified, assign diagonal rotations
    if (!model.rotationAxis && !model.rotationConfig) {
      const diagonalRotations = ['xy', 'xz', 'yz', 'xyz']
      return {
        ...model,
        rotationAxis: diagonalRotations[index % diagonalRotations.length] as 'xy' | 'xz' | 'yz' | 'xyz',
        rotationSpeed: 0.005 + (index * 0.002)
      }
    }
    return model
  })
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {modelsWithDefaults.map((model, index) => (
        <div key={index} className="bg-[#222222] rounded-lg overflow-hidden">
          <Suspense fallback={
            <div className="flex justify-center items-center h-[200px] bg-[#222222]">
              <div className="animate-spin text-[#D8110A]">
                <ReloadIcon className="w-6 h-6" />
              </div>
            </div>
          }>
            <GlbModelViewer 
              url={model.url} 
              height={itemHeight} 
              rotationAxis={model.rotationAxis}
              rotationSpeed={model.rotationSpeed}
              rotationConfig={model.rotationConfig}
            />
          </Suspense>
          
          <div className="p-3">
            <h3 className="text-white font-medium">{model.name}</h3>
            {model.description && (
              <p className="text-gray-400 text-sm mt-1 flex items-start">
                <InfoCircledIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{model.description}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 