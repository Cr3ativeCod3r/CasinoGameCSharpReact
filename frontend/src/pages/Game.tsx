'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Wykres from '@/components/Chart'
import Betting from '@/components/Betting'
import Chat from '@/components/Chat'
import History from '@/components/History'
import PlayerInGame from '@/components/PlayerInGame'

export default function GamePage() {
  const [activeView, setActiveView] = useState<'chat' | 'history'>('chat')

  return (
    <div className="font-sans min-h-screen bg-[rgb(24,26,30)] text-white overflow-hidden">
      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex flex-col w-3/5 ">

          <div>
            <div className="border-r border-[rgb(41,36,36)]">
              <Wykres />
            </div>
            <div className="w-2/5 ml-auto">
              <Betting />
            </div>
          </div>


          <div className="flex h-[50%] border-t border-[rgb(41,36,36)]">
            <div className="w-10 bg-[rgb(41,44,53)] flex flex-col">
              <div
                className={`h-1/2 w-full text-orange-500 cursor-pointer flex items-center justify-center transform rotate-180 ${activeView === 'chat' ? 'bg-[rgb(26,31,31)]' : ''}`}
                style={{ writingMode: 'vertical-rl' }}
                onClick={() => setActiveView('chat')}
              >
                Chat
              </div>
              <div
                className={`h-1/2 w-full text-orange-500 cursor-pointer flex items-center justify-center transform rotate-180 ${activeView === 'history' ? 'bg-[rgb(26,31,31)]' : ''}`}
                style={{ writingMode: 'vertical-rl' }}
                onClick={() => setActiveView('history')}
              >
                History
              </div>
            </div>

            {/* Panel z Chatem lub Historią */}
            <div className="flex-1 overflow-hidden">
              {activeView === 'chat' ? (
                <Chat style={{ height: '100%' }} />
              ) : (
                <History />
              )}
            </div>
          </div>
        </div>

        {/* Prawa część: PlayerInGame */}
        <div className="w-2/5 border-l border-[rgb(41,36,36)]">
          <PlayerInGame />
        </div>
      </div>
    </div>
  )
}