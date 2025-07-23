// components/History.tsx
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface CrashHistoryItem {
  id: number
  crashedAt: string
  crashPoint: number
}

export default function History() {
  const [history, setHistory] = useState<CrashHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/crashhistory/crashedhistory', {
          params: { count: 20 }
        })
        if (response.data.success) {
          setHistory(response.data.data)
          setError(null)
        }
      } catch (err) {
        console.error('Błąd podczas pobierania historii gier:', err)
        setError('Nie udało się załadować historii.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = () => {
    if (error) {
      return <div className="text-red-400 text-xs text-center p-2">{error}</div>
    }

    return history.map((game, index) => (
      <div
        key={game.id}
        className={`rounded-sm flex justify-between items-center text-xs ${index % 2 === 0 ? 'bg-[#181A1E]' : 'bg-[#1b1d20]'
          }`}
      >
        <span className={`font-bold ${game.crashPoint >= 2 ? 'text-green-500' : 'text-red-500'
          }`}>
          {game.crashPoint.toFixed(2)}x
        </span>
        <span className="text-gray-400">
          {formatTime(game.crashedAt)}
        </span>
      </div>
    ))
  }

  return (
    <div className="flex-1 p-2 rounded-md">
      <h3 className="text-white text-md mb-2">Crash</h3>
      <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
        {renderContent()}
      </div>
    </div>
  )
}