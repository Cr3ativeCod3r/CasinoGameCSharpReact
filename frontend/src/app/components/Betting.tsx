import { useState, useEffect } from 'react';
import useCrashGameStore, { 
  canPlaceBet, 
  canWithdraw, 
  getCurrentUserBet, 
  getHasActiveBet, 
  getFormattedMultiplier, 
  getFormattedTimeRemaining 
} from '@/app/stores/CrashGameStore';
import useAuthStore from '@/app/stores/AuthStore';
import { CrashGamePhase } from '@/app/types/crash';

const Betting = () => {
  const [betInput, setBetInput] = useState('');
  const [autoCashOutInput, setAutoCashOutInput] = useState('');
  const [lastBetPlaced, setLastBetPlaced] = useState(false);

  const { user, token, isAuthenticated } = useAuthStore();

  const {
    phase,
    multiplier,
    bets,
    autoCashOut,
    loading,
    connected,
    error,
    balance,
    setBetAmount,
    setAutoCashOut,
    placeBet,
    withdraw,
    connect,
    disconnect,
    checkAutoCashOut,
    timeRemaining,
  } = useCrashGameStore();

  const currentState = useCrashGameStore.getState();
  const userId = user?.id;

  useEffect(() => {
    if (isAuthenticated && token && userId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, isAuthenticated, token, userId]);

  useEffect(() => {
    const amount = parseFloat(betInput) || 0;
    setBetAmount(amount);
  }, [betInput, setBetAmount]);

  useEffect(() => {
    const amount = parseFloat(autoCashOutInput) || 0;
    setAutoCashOut(amount);
  }, [autoCashOutInput, setAutoCashOut]);

  useEffect(() => {
    if (userId) {
      checkAutoCashOut(userId);
    }
  }, [multiplier, autoCashOut, checkAutoCashOut, userId]);

  useEffect(() => {
    if (!userId) return;
    
    const hasActiveBet = getHasActiveBet(currentState, userId);
    if (hasActiveBet && !lastBetPlaced) {
      setBetInput('');
      setLastBetPlaced(true);
    } else if (!hasActiveBet && lastBetPlaced) {
      setLastBetPlaced(false);
    }
  }, [getHasActiveBet(currentState, userId), lastBetPlaced, userId]);

  const handlePlaceBet = () => {
    if (userId && canPlaceBet(currentState, userId)) {
      placeBet(userId);
    }
  };

  const handleWithdraw = () => {
    if (userId && canWithdraw(currentState, userId)) {
      withdraw(userId);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (!connected) return 'Connecting...';
    if (!isAuthenticated || !userId) return 'Login Required';
    
    const hasActiveBet = getHasActiveBet(currentState, userId);
    const canPlaceBetState = canPlaceBet(currentState, userId);
    const canWithdrawState = canWithdraw(currentState, userId);
    
    if (hasActiveBet) {
      if (phase === CrashGamePhase.Running && canWithdrawState) {
        return 'CASH OUT';
      }
      if (phase === CrashGamePhase.Betting) {
        return 'BET PLACED';
      }
      if (phase === CrashGamePhase.Running) {
        return 'GAME ACTIVE';
      }
      if (phase === CrashGamePhase.Crashed) {
        return 'CRASHED';
      }
    }
    
    if (phase === CrashGamePhase.Betting) {
      if (canPlaceBetState) {
        return 'PLACE BET';
      } else if (currentState.betAmount <= 0) {
        return 'ENTER AMOUNT';
      } else if (currentState.betAmount > currentState.balance) {
        return 'INSUFFICIENT FUNDS';
      } else {
        return 'INVALID BET';
      }
    }
    
    if (phase === CrashGamePhase.Running) {
      return 'GAME ACTIVE';
    }
    
    if (phase === CrashGamePhase.Crashed) {
      return 'CRASHED';
    }
    
    return `WAITING... (Phase: ${phase})`;
  };

  const getButtonColor = () => {
    if (!connected || !isAuthenticated || !userId) return 'gray';
    if (canWithdraw(currentState, userId)) return 'green';
    if (canPlaceBet(currentState, userId)) return 'orange';
    return 'gray';
  };

  const getButtonAction = () => {
    if (!isAuthenticated || !userId) return () => { };
    if (canWithdraw(currentState, userId)) return handleWithdraw;
    if (canPlaceBet(currentState, userId)) return handlePlaceBet;
    return () => { };
  };

  const currentUserBet = getCurrentUserBet(currentState, userId);
  const hasActiveBet = getHasActiveBet(currentState, userId);
  const formattedMultiplier = getFormattedMultiplier(currentState);
  const formattedTimeRemaining = getFormattedTimeRemaining(currentState);
  const canPlaceBetState = canPlaceBet(currentState, userId);
  const canWithdrawState = canWithdraw(currentState, userId);

  const currentPayout = currentUserBet && phase === CrashGamePhase.Running
    ? (parseFloat(currentUserBet.betAmount.toString()) * multiplier).toFixed(2)
    : null;

  if (!isAuthenticated) {
    return (
      <div
        className="float-right w-2/5 h-110 border text-white p-2 flex items-center justify-center"
        style={{
          backgroundColor: 'rgb(24, 26, 30)',
          borderColor: 'rgb(41, 36, 36)'
        }}
      >
        <div className="text-center">
          <div className="text-xl mb-4">Login Required</div>
          <div className="text-sm text-gray-400">
            Please log in to place bets
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="float-right w-2/5 h-110 border text-white p-2"
      style={{
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >
      <div className="text-xs mt-1">
        Status: {connected ?
          <span className="text-green-400">Connected</span> :
          <span className="text-red-400">Disconnected</span>
        }
      </div>
      <div className="text-xs mt-1">
        Balance: {balance}
      </div>
      <div className="text-xs mt-1">
        {phase === CrashGamePhase.Betting ?
          `Betting ends in: ${formattedTimeRemaining}` :
          `Game active: ${formattedMultiplier}`
        }
      </div>
      <div className="text-xs mt-1 bg-blue-900 p-1 rounded">
        <div>User ID: {userId || 'N/A'}</div>
        <div>Username: {user?.nickName || 'N/A'}</div>
        <div>Token: {token ? 'YES' : 'NO'}</div>
        <div>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</div>
        <div>Total bets: {Object.keys(bets).length}</div>
        <div>Bet IDs: {Object.keys(bets).join(', ')}</div>
        <div>Has bet: {hasActiveBet ? 'YES' : 'NO'}</div>
        <div>Can withdraw: {canWithdrawState ? 'YES' : 'NO'}</div>
        <div>Current bet: {currentUserBet ? currentUserBet.betAmount : 'NONE'}</div>
        <div>Phase: {phase}</div>
      </div>
      {currentUserBet && (
        <div className="text-xs mt-1 p-1 bg-gray-700 rounded">
          <div>Your bet: {currentUserBet.betAmount}</div>
          {currentUserBet.inGame?.withdrew && (
            <div className="text-green-400">
              Cashed out at {currentUserBet.inGame.withdrawMultiplier?.toFixed(2)}x
              <br />
              Profit: {currentUserBet.inGame.withdrawProfit?.toFixed(2)}
            </div>
          )}
          {phase === CrashGamePhase.Running && !currentUserBet.inGame?.withdrew && (
            <div className="text-blue-400">
              Current value: {currentPayout}
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
          disabled={phase !== CrashGamePhase.Betting || hasActiveBet || !isAuthenticated}
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
          disabled={!isAuthenticated}
        />
      </div>
      {error && (
        <div className="text-red-400 text-xs mt-2">
          {error}
        </div>
      )}
      <button
        onClick={getButtonAction()}
        disabled={loading || !connected || !isAuthenticated || (!canPlaceBetState && !canWithdrawState)}
        className="w-full mt-2 rounded-2xl text-3xl text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          height: '200px',
          backgroundColor: getButtonColor()
        }}
      >
        {getButtonText()}
      </button>
      {canWithdrawState && currentUserBet && phase === CrashGamePhase.Running && currentPayout && isAuthenticated && (
        <button
          onClick={handleWithdraw}
          className="w-full mt-4 rounded-xl text-xl font-bold bg-yellow-500 hover:bg-yellow-600 text-black py-3 transition"
        >
          CASH OUT: {currentPayout}
        </button>
      )}
    </div>
  );
};

export default Betting;