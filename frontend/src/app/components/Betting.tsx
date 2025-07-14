'use client'

import { useState } from 'react'

export default function Betting() {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual')

  return (
    <div 
      className="float-right h-96 w-2/5 border text-white p-2"
      style={{ 
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >
      <div className="flex">
        <div 
          className={`w-full h-10 text-center border border-black cursor-pointer flex items-center justify-center ${
            mode === 'manual' ? '' : ''
          }`}
          style={{ 
            backgroundColor: mode === 'manual' ? 'rgb(24, 26, 30)' : 'rgb(41, 44, 53)',
            color: 'white'
          }}
          onClick={() => setMode('manual')}
        >
          Manual
        </div>
        <div 
          className={`w-full h-10 text-center border border-black cursor-pointer flex items-center justify-center ${
            mode === 'auto' ? '' : ''
          }`}
          style={{ 
            backgroundColor: mode === 'auto' ? 'rgb(24, 26, 30)' : 'rgb(41, 44, 53)',
            color: 'white'
          }}
          onClick={() => setMode('auto')}
        >
          Auto
        </div>
      </div>
      
      <div >
        <label htmlFor="bet" className="block">Bet (max 500.000)</label>
        <input 
          id="bet"
          type="number" 
          className="h-8 w-full bg-white text-black p-2 rounded"
          placeholder="Amount"
        />
      </div>
      
      <div>
        <label htmlFor="autoCashOut" className="block">Auto Cash Out</label>
        <input 
          id="autoCashOut"
          type="number" 
          className="h-8 w-full bg-white text-black p-2 rounded"
          placeholder="Amount"
        />
      </div>
      
      <button 
        className="w-full mt-2 rounded-2xl text-3xl text-white cursor-pointer"
        style={{ 
          height: '200px',
          backgroundColor: 'orange'
        }}
      >
        Place bet
      </button>
    </div>
  )
}