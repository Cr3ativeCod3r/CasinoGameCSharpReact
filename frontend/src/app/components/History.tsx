// components/History.tsx
'use client'

export default function History() {
  return (
    <div className="flex-1 p-4">
      <h3 className="text-white text-lg mb-4">Game History</h3>
      <div className="space-y-2">
        {/* Przykładowa historia */}
        <div className="p-2 rounded text-sm bg-red-800">
          <div className="text-white">2.45x</div>
          <div className="text-gray-300 text-xs">10:29:15</div>
        </div>
        <div className="p-2 rounded text-sm bg-red-800">
          <div className="text-white">1.23x</div>
          <div className="text-gray-300 text-xs">10:28:45</div>
        </div>
      </div>
    </div>
  )
}