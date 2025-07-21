'use client'

import { useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Wykres from '@/app/components/Wykres'
import Betting from '@/app/components/Betting'
import Chat from '@/app/components/Chat'
import History from '@/app/components/History'
import PlayerInGame from '@/app/components/PlayerInGame'

export default function GamePage() {
  const [activeView, setActiveView] = useState<'chat' | 'history'>('chat')

  return (
    <div className="font-sans min-h-screen" style={{ backgroundColor: 'rgb(24, 26, 30)' }}>
      <Navbar />
      <div
        className="flex w-full"
        style={{
          height: '95vh',
          minHeight: '95vh',
          maxHeight: '95vh'
        }}
      >
        {/* Left side */}
        <div
          className="w-3/5 border-b flex flex-col"
          style={{
            backgroundColor: 'rgb(24, 26, 30)',
            borderColor: 'rgb(41, 36, 36)',
            height: '100%'
          }}
        >
          <div className="flex flex-1 min-h-0">
            <Wykres />
            <Betting />
          </div>
          {/* Bottom section */}
          <div
            className="w-1/2 border flex flex-1 min-h-0"
            style={{
              backgroundColor: 'rgb(24, 26, 30)',
              borderColor: 'rgb(41, 36, 36)',
              height: '35%'
            }}
          >
            {/* Navigation tabs */}
            <div
              className="w-10 mr-1 flex flex-col"
              style={{
                backgroundColor: 'rgb(41, 44, 53)',
                height: '100%'
              }}
            >
              <div
                className={`h-1/2 w-full text-orange-500 cursor-pointer flex items-center justify-center transform rotate-180 ${activeView === 'chat' ? 'bg-opacity-50' : ''
                  }`}
                style={{
                  writingMode: 'vertical-rl',
                  backgroundColor: activeView === 'chat' ? 'rgb(26, 31, 31)' : ''
                }}
                onClick={() => setActiveView('chat')}
              >
                Chat
              </div>
              <div
                className={`h-1/2 w-full text-orange-500 cursor-pointer flex items-center justify-center transform rotate-180 ${activeView === 'history' ? 'bg-opacity-50' : ''
                  }`}
                style={{
                  writingMode: 'vertical-rl',
                  backgroundColor: activeView === 'history' ? 'rgb(26, 31, 31)' : ''
                }}
                onClick={() => setActiveView('history')}
              >
                History
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 min-h-0">
              {activeView === 'chat' ? <Chat style={{ height: '100%' }} /> : <History />}
            </div>
          </div>
        </div>
        {/* Right side */}
        <div
          className="w-2/5 border flex flex-col"
          style={{
            backgroundColor: 'rgb(24, 26, 30)',
            borderColor: 'rgb(41, 36, 36)',
            height: '100%'
          }}
        >
          <PlayerInGame />
        </div>
      </div>
    </div>
  )
}