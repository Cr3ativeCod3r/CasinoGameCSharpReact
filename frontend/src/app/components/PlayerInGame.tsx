'use client'
import useCrashGameStore, { 
  getBetsArray, 
  getFormattedMultiplier 
} from '@/app/stores/CrashGameStore';

const PlayerInGame = () => {
  const { gameActive, multiplier } = useCrashGameStore();
  const betsArray = getBetsArray(useCrashGameStore.getState());
  const formattedMultiplier = getFormattedMultiplier(useCrashGameStore.getState());

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
            {betsArray.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 text-sm p-4">
                  No bets placed yet
                </td>
              </tr>
            ) : (
              betsArray.map((bet) => (
                <tr key={bet.playerID} className="border-b" style={{ borderColor: 'rgb(41, 36, 36)' }}>
                  <td className="text-xs text-white w-36 text-center p-2">
                    {bet.playerName}
                  </td>
                  <td className="text-xs text-white w-12 text-center p-2">
                    {bet.inGame.withdrew ? '✓' : ''}
                  </td>
                  <td className="text-xs text-white w-36 text-center p-2">
                    {bet.betAmount.toLocaleString()}
                  </td>
                  <td className={`text-xs w-36 text-center p-2 ${
                    bet.inGame.withdrew 
                      ? bet.inGame.withdrawProfit > bet.betAmount 
                        ? 'text-green-400' 
                        : 'text-red-400'
                      : gameActive 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                  }`}>
                    {bet.inGame.withdrew 
                      ? (bet.inGame.withdrawProfit > bet.betAmount ? '+' : '') + 
                        (bet.inGame.withdrawProfit - bet.betAmount).toLocaleString()
                      : gameActive 
                        ? `${(bet.betAmount * multiplier).toLocaleString()} (${formattedMultiplier})`
                        : `-${bet.betAmount.toLocaleString()}`
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Stats */}
      <div className="text-xs text-gray-400 p-2 border-t" style={{ borderColor: 'rgb(41, 36, 36)' }}>
        Total players: {betsArray.length} | 
        Cashed out: {betsArray.filter(bet => bet.inGame.withdrew).length}
      </div>
    </div>
  );
};

export default PlayerInGame;