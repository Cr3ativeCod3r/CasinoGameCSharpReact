import { useState, useEffect } from 'react';
import useCrashGameStore, { 
  canPlaceBet, 
  canWithdraw, 
  getCurrentUserBet, 
  getHasActiveBet, 
  getFormattedMultiplier, 
  getFormattedTimeRemaining 
} from '@/app/stores/CrashGameStore';
import authStore from '@/app/stores/AuthStore';

const Betting = () => {
  const [betInput, setBetInput] = useState('');
  const [autoCashOutInput, setAutoCashOutInput] = useState('');

  const {
    multiplier,
    autoCashOut,
    loading,
    connected,
    bettingOpen,
    gameActive,
    error,
    connect,
    disconnect,
    setBetAmount,
    setAutoCashOut,
    placeBet,
    withdraw,
    checkAutoCashOut
  } = useCrashGameStore();

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    // Update bet amount when input changes
    const amount = parseFloat(betInput) || 0;
    setBetAmount(amount);
  }, [betInput, setBetAmount]);

  useEffect(() => {
    // Update auto cash out when input changes
    const amount = parseFloat(autoCashOutInput) || 0;
    setAutoCashOut(amount);
  }, [autoCashOutInput, setAutoCashOut]);

  useEffect(() => {
    // Auto cash out logic
    checkAutoCashOut();
  }, [multiplier, autoCashOut, checkAutoCashOut]);

  const handlePlaceBet = () => {
    placeBet();
  };

  const handleWithdraw = () => {
    withdraw();
  };

  const getButtonText = () => {
    const state = useCrashGameStore.getState();
    if (loading) return 'Loading...';
    if (!connected) return 'Connecting...';
    if (!bettingOpen && gameActive) {
      return canWithdraw(state) ? 'CASH OUT' : 'GAME ACTIVE';
    }
    if (getHasActiveBet(state)) return 'BET PLACED';
    if (!bettingOpen) return 'BETTING CLOSED';
    return 'PLACE BET';
  };

  const getButtonColor = () => {
    const state = useCrashGameStore.getState();
    if (!connected) return 'gray';
    if (canWithdraw(state)) return 'green';
    if (canPlaceBet(state)) return 'orange';
    return 'gray';
  };

  const getButtonAction = () => {
    const state = useCrashGameStore.getState();
    if (canWithdraw(state)) return handleWithdraw;
    if (canPlaceBet(state)) return handlePlaceBet;
    return () => { };
  };

  const currentUserBet = getCurrentUserBet(useCrashGameStore.getState());
  const hasActiveBet = getHasActiveBet(useCrashGameStore.getState());
  const formattedMultiplier = getFormattedMultiplier(useCrashGameStore.getState());
  const formattedTimeRemaining = getFormattedTimeRemaining(useCrashGameStore.getState());
  const canPlaceBetState = canPlaceBet(useCrashGameStore.getState());
  const canWithdrawState = canWithdraw(useCrashGameStore.getState());

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
        Status: {connected ?
          <span className="text-green-400">Connected</span> :
          <span className="text-red-400">Disconnected</span>
        }
      </div>

      {/* Timer */}
      <div className="text-xs mt-1">
        {bettingOpen ?
          `Betting ends in: ${formattedTimeRemaining}` :
          `Game active: ${formattedMultiplier}`
        }
      </div>

      {/* Current User Bet Info */}
      {currentUserBet && (
        <div className="text-xs mt-1 p-1 bg-gray-700 rounded">
          <div>Your bet: {currentUserBet.betAmount}</div>
          {currentUserBet.inGame.withdrew && (
            <div className="text-green-400">
              Cashed out at {currentUserBet.inGame.withdrawMultiplier.toFixed(2)}x
              <br />
              Profit: {currentUserBet.inGame.withdrawProfit.toFixed(2)}
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
          disabled={!bettingOpen || hasActiveBet}
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
      {error && (
        <div className="text-red-400 text-xs mt-2">
          {error}
        </div>
      )}

      <button
        onClick={getButtonAction()}
        disabled={loading || !connected || (!canPlaceBetState && !canWithdrawState)}
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
};

export default Betting;