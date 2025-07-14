// components/PlayerInGame.tsx
'use client'

export default function PlayerInGame() {
  return (
    <div 
      className="w-full border h-full"
      style={{ 
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >
      <div 
        className="w-full h-10"
        style={{ backgroundColor: 'rgb(41, 44, 53)' }}
      >
        <table className="w-full h-full border-collapse">
          <thead>
            <tr>
              <td className="text-xs text-white w-36 text-center">NICKNAME</td>
              <td className="text-xs text-white w-12 text-center">@</td>
              <td className="text-xs text-white w-36 text-center">BET</td>
              <td className="text-xs text-white w-36 text-center">PROFIT</td>
            </tr>
          </thead>
        </table>
      </div>
      
      <div className="overflow-y-auto max-h-96">
        <table className="w-full border-collapse">
          <tbody>
            {/* Przykładowy gracz */}
            <tr className="border-b" style={{ borderColor: 'rgb(41, 36, 36)' }}>
              <td className="text-xs text-white w-36 text-center p-2">Player1</td>
              <td className="text-xs text-white w-12 text-center p-2">✓</td>
              <td className="text-xs text-white w-36 text-center p-2">1,000</td>
              <td className="text-xs text-green-400 w-36 text-center p-2">+500</td>
            </tr>
            <tr className="border-b" style={{ borderColor: 'rgb(41, 36, 36)' }}>
              <td className="text-xs text-white w-36 text-center p-2">Player2</td>
              <td className="text-xs text-white w-12 text-center p-2"></td>
              <td className="text-xs text-white w-36 text-center p-2">2,500</td>
              <td className="text-xs text-red-400 w-36 text-center p-2">-2,500</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}