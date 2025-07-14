// components/Wykres.tsx
'use client'

export default function Wykres() {
  return (
    <div 
      className="float-left h-96 w-3/5 border" 
      style={{ 
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >
      <div id="canvas-container" className="w-full h-full">
        {/* Puste miejsce na wykres - będzie implementowane później */}
      </div>
    </div>
  )
}