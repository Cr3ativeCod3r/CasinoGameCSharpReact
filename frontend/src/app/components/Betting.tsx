import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import crashGameStore from '@/app/stores/CrashGameStore';
import authStore from '@/app/stores/AuthStore';

const Betting = observer(() => {
  const [betInput, setBetInput] = useState('');
  const [autoCashOutInput, setAutoCashOutInput] = useState('');

  useEffect(() => {
    crashGameStore.connect();
    return () => {
      crashGameStore.disconnect();
    };
  }, []);

  useEffect(() => {
    // Update bet amount when input changes
    const amount = parseFloat(betInput) || 0;
    crashGameStore.setBetAmount(amount);
  }, [betInput]);

  useEffect(() => {
    // Update auto cash out when input changes
    const amount = parseFloat(autoCashOutInput) || 0;
    crashGameStore.setAutoCashOut(amount);
  }, [autoCashOutInput]);

  useEffect(() => {
    // Auto cash out logic
    crashGameStore.checkAutoCashOut();
  }, [crashGameStore.multiplier, crashGameStore.autoCashOut]);

  const handlePlaceBet = () => {
    crashGameStore.placeBet();
  };

  const handleWithdraw = () => {
    crashGameStore.withdraw();
  };

  const getButtonText = () => {
    if (crashGameStore.loading) return 'Loading...';
    if (!crashGameStore.connected) return 'Connecting...';
    if (!crashGameStore.bettingOpen && crashGameStore.gameActive) {
      return crashGameStore.canWithdraw ? 'CASH OUT' : 'GAME ACTIVE';
    }
    if (crashGameStore.hasActiveBet) return 'BET PLACED';
    if (!crashGameStore.bettingOpen) return 'BETTING CLOSED';
    return 'PLACE BET';
  };

  const getButtonColor = () => {
    if (!crashGameStore.connected) return 'gray';
    if (crashGameStore.canWithdraw) return 'green';
    if (crashGameStore.canPlaceBet) return 'orange';
    return 'gray';
  };

  const getButtonAction = () => {
    if (crashGameStore.canWithdraw) return handleWithdraw;
    if (crashGameStore.canPlaceBet) return handlePlaceBet;
    return () => { };
  };

  return (
    <div
      className="float-right w-2/5 h-110 border text-white p-2"
      style={{
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >

      {/* Connection Status */}
      <div className="text-xs mt-1">
        Status: {crashGameStore.connected ?
          <span className="text-green-400">Connected</span> :
          <span className="text-red-400">Disconnected</span>
        }
      </div>

      {/* Timer */}
      <div className="text-xs mt-1">
        {crashGameStore.bettingOpen ?
          `Betting ends in: ${crashGameStore.formattedTimeRemaining}` :
          `Game active: ${crashGameStore.formattedMultiplier}`
        }
      </div>

      {/* Current User Bet Info */}
      {crashGameStore.currentUserBet && (
        <div className="text-xs mt-1 p-1 bg-gray-700 rounded">
          <div>Your bet: {crashGameStore.currentUserBet.betAmount}</div>
          {crashGameStore.currentUserBet.inGame.withdrew && (
            <div className="text-green-400">
              Cashed out at {crashGameStore.currentUserBet.inGame.withdrawMultiplier.toFixed(2)}x
              <br />
              Profit: {crashGameStore.currentUserBet.inGame.withdrawProfit.toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="bet" className="block mt-2">Bet (max 500.000)</label>
        <input
          id="bet"
          type="number"
          value={betInput}
          onChange={(e) => setBetInput(e.target.value)}
          className="h-8 w-full bg-white text-black p-2 rounded"
          placeholder="Amount"
          disabled={!crashGameStore.bettingOpen || crashGameStore.hasActiveBet}
        />
      </div>

      <div>
        <label htmlFor="autoCashOut" className="block mt-2">Auto Cash Out</label>
        <input
          id="autoCashOut"
          type="number"
          value={autoCashOutInput}
          onChange={(e) => setAutoCashOutInput(e.target.value)}
          className="h-8 w-full bg-white text-black p-2 rounded"
          placeholder="Amount"
          step="0.01"
          min="1.01"
        />
      </div>

      {/* Error Display */}
      {crashGameStore.error && (
        <div className="text-red-400 text-xs mt-2">
          {crashGameStore.error}
        </div>
      )}

      <button
        onClick={getButtonAction()}
        disabled={crashGameStore.loading || !crashGameStore.connected ||
          (!crashGameStore.canPlaceBet && !crashGameStore.canWithdraw)}
        className="w-full mt-2 rounded-2xl text-3xl text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          height: '200px',
          backgroundColor: getButtonColor()
        }}
      >
        {getButtonText()}
      </button>
    </div>
  );
});

export default Betting;