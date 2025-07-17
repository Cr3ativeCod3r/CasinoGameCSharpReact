// app/game/page.tsx
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
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'rgb(24, 26, 30)' }}>
      <Navbar />
      
      <div className="flex">
        {/* Left side */}
        <div 
          className="w-3/5 min-h-screen border-b"
          style={{ 
            backgroundColor: 'rgb(24, 26, 30)',
            borderColor: 'rgb(41, 36, 36)'
          }}
        >
          <div className="flex">
            <Wykres />
            <Betting />
          </div>
          
          {/* Bottom section */}
          <div 
            className="clear-both h-80 w-full border flex"
            style={{ 
              backgroundColor: 'rgb(24, 26, 30)',
              borderColor: 'rgb(41, 36, 36)'
            }}
          >
            {/* Navigation tabs */}
            <div 
              className="w-10 mr-1 flex flex-col"
              style={{ 
                backgroundColor: 'rgb(41, 44, 53)',
                height: '300px'
              }}
            >
              <div 
                className={`h-40 w-full text-orange-500 cursor-pointer flex items-center justify-center transform rotate-180 ${
                  activeView === 'chat' ? 'bg-opacity-50' : ''
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
                className={`h-40 w-full text-orange-500 cursor-pointer flex items-center justify-center transform rotate-180 ${
                  activeView === 'history' ? 'bg-opacity-50' : ''
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
            <div className="flex-1">
              {activeView === 'chat' ? <Chat /> : <History />}
            </div>
          </div>
        </div>
        
        {/* Right side */}
        <div 
          className="w-2/5 min-h-screen border mt-2"
          style={{ 
            backgroundColor: 'rgb(24, 26, 30)',
            borderColor: 'rgb(41, 36, 36)'
          }}
        >
          <PlayerInGame />
        </div>
      </div>
    </div>
  )
}