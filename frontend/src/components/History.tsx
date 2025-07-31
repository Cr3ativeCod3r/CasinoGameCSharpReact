import { useEffect, useState } from 'react'
import useAuthStore from '@/stores/AuthStore' 

interface Bet {
  playerName: string
  betAmount: number
  withdrew: boolean
  withdrawMultiplier: number
  withdrawProfit: number
  playerId?: string
}

interface CrashHistoryItem {
  id: number
  crashedAt: string
  crashPoint: number
  totalBets: number
  totalBetAmount: number
  totalWithdrawals: number
  totalProfit: number
  bets: Bet[]
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhos:5000";

export default function History() {
  const [history, setHistory] = useState<CrashHistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(apiUrl + `/api/crashhistory/crashedhistory?count=20`)
        const data = await response.json()
        
        if (data.success) {
          setHistory(data.data)
          setError(null)
        }
      } catch (err) {
        console.error('Błąd podczas pobierania historii gier:', err)
        setError('Nie udało się załadować historii.')
      } 
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 10000)
    return () => clearInterval(interval)
  }, [])


  const getUserBet = (game: CrashHistoryItem) => {
    if (!isAuthenticated || !user?.id) return null
    return game.bets.find(bet => bet.playerId === user.id)
  }

  const getProfit = (userBet: Bet) => {
    if (userBet.withdrew) {
      const profit = userBet.withdrawProfit - userBet.betAmount
      return profit
    }
    return -userBet.betAmount
  }

  const renderContent = () => {
    if (error) {
      return <div className="text-red-400 text-xs text-center p-2">{error}</div>
    }

    return history.map((game, index) => {
      const userBet = getUserBet(game)
      
      return (
        <div
          key={game.id}
          className={`rounded-sm flex justify-between items-center text-xs p-1 ${
            index % 2 === 0 ? 'bg-[#181A1E]' : 'bg-[#1b1d20]'
          }`}
        >
          {/* CRASH column */}
          <div className="flex-1 text-left">
            <span className={`font-bold ${game.crashPoint >= 2 ? 'text-green-500' : 'text-red-500'}`}>
              {game.crashPoint.toFixed(2)}x
            </span>
          </div>
          
          {/* @ column */}
          <div className="flex-1 text-center">
            <span className="text-white">
              {userBet?.withdrew ? userBet.withdrawMultiplier.toFixed(2) : '-'}
            </span>
          </div>
          
          {/* BET column */}
          <div className="flex-1 text-center">
            <span className="text-white">
              {userBet ? userBet.betAmount.toLocaleString() : '-'}
            </span>
          </div>
          
          {/* PROFIT column */}
          <div className="flex-1 text-right">
            <span className={userBet ? (getProfit(userBet) > 0 ? 'text-green-500' : 'text-red-500') : 'text-white'}>
              {userBet ? (getProfit(userBet) > 0 ? '+' : '') + getProfit(userBet).toLocaleString() : '-'}
            </span>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="flex-1 rounded-md">
      <div className="flex justify-between items-center text-xs font-bold mb-1 px-2">
        <div className="flex-1 text-left text-gray-300">Crash</div>
        <div className="flex-1 text-center text-gray-300">@</div>
        <div className="flex-1 text-center text-gray-300">Bet</div>
        <div className="flex-1 text-right text-gray-300">Profit</div>
      </div>

      <div className=" max-h-[350px] overflow-y-auto px-1">
        {renderContent()}
      </div>
    </div>
  )
}