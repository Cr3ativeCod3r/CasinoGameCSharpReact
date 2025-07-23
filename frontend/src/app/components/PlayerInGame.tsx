'use client'
import useCrashGameStore, { 
  getBetsArray, 
} from '@/app/stores/CrashGameStore';
import { CrashGamePhase } from '@/app/types/crash';

const PlayerInGame = () => {
  const { gameActive, multiplier, phase } = useCrashGameStore();
  const betsArray = getBetsArray(useCrashGameStore.getState());

  const getRowColor = (bet) => {
    if (bet.inGame.withdrew) {
      return bet.inGame.withdrawProfit > bet.betAmount ? 'text-[rgb(40,117,40)]' : 'text-red-400';
    }
    
    if (phase === CrashGamePhase.Crashed) {
      return 'text-red-400';
    }
    
    return 'text-[rgb(200,130,0)]';
  };


  const shouldShowProfit = (bet) => {
    return bet.inGame.withdrew || phase === CrashGamePhase.Crashed;
  };

  const getProfit = (bet) => {
    if (bet.inGame.withdrew) {
      const profit = bet.inGame.withdrawProfit - bet.betAmount;
      return (profit > 0 ? '+' : '') + profit.toLocaleString();
    }
    return `-${bet.betAmount.toLocaleString()}`;
  };

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
      
      <div className="overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {betsArray.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 text-sm p-4">
                  No bets placed yet
                </td>
              </tr>
            ) : (
              betsArray.map((bet) => {
                const rowColor = getRowColor(bet);
                
                return (
                  <tr key={bet.playerID}>
                    <td className={`text-md w-36 text-center p-2 ${rowColor}`}>
                      {bet.playerName}
                    </td>
                    <td className={`text-md w-12 text-center p-2 ${rowColor}`}>
                      {bet.inGame.withdrew ? bet.inGame.withdrawMultiplier.toFixed(2) : '-'}
                    </td>
                    <td className={`text-md w-36 text-center p-2 ${rowColor}`}>
                      {bet.betAmount.toLocaleString()}
                    </td>
                    <td className={`text-md w-36 text-center p-2 ${rowColor}`}>
                      {shouldShowProfit(bet) ? getProfit(bet) : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    
    </div>
  );
};

export default PlayerInGame;