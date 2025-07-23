import { useState, useEffect } from 'react';
import useCrashGameStore, {
  canPlaceBet,
  canWithdraw,
  getCurrentUserBet,
  getHasActiveBet,
} from '@/app/stores/CrashGameStore';
import useAuthStore from '@/app/stores/AuthStore';
import useConnectionStore from '@/app/stores/ConnectionStore';
import { CrashGamePhase } from '@/app/types/crash';

const Betting = () => {
  const [betInput, setBetInput] = useState('');
  const [autoCashOutInput, setAutoCashOutInput] = useState('');

  const { user, isAuthenticated } = useAuthStore();
  const { connected } = useConnectionStore();

  const {
    phase,
    multiplier,
    loading,
    error,
    balance,
    setBetAmount,
    setAutoCashOut,
    placeBet,
    withdraw,
    checkAutoCashOut,
  } = useCrashGameStore();

  const currentState = useCrashGameStore.getState();
  const userId = user?.id;

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
  }, [multiplier, checkAutoCashOut, userId]);

  useEffect(() => {
    if (!userId) return;
    const hasActiveBet = getHasActiveBet(currentState, userId);
    if (hasActiveBet) {
      setBetInput('');
    }
  }, [getHasActiveBet(currentState, userId), userId]);

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
  
  const currentUserBet = getCurrentUserBet(currentState, userId);
  const hasActiveBet = getHasActiveBet(currentState, userId);
  const canPlaceBetState = canPlaceBet(currentState, userId);
  const canWithdrawState = canWithdraw(currentState, userId);

  const getButtonContent = () => {
    if (loading) return 'Loading...';
    if (!connected) return 'Connecting...';
    if (!isAuthenticated || !userId) return 'Login Required';

    if (hasActiveBet) {
      if (phase === CrashGamePhase.Running && canWithdrawState && currentUserBet) {
        const currentPayout = (parseFloat(currentUserBet.betAmount.toString()) * multiplier).toFixed(2);
        return (
          <>
            <span className="block text-4xl font-bold">CASH OUT</span>
            <span className="block text-3xl mt-2 font-mono">
              @{currentPayout}
            </span>
          </>
        );
      }
      if (phase === CrashGamePhase.Betting) return 'BET PLACED';
      if (phase === CrashGamePhase.Running) return 'GAME ACTIVE';
      if (phase === CrashGamePhase.Crashed) return 'CRASHED';
    }

    if (phase === CrashGamePhase.Betting) {
      if (canPlaceBetState) return 'PLACE BET';
      if (currentState.betAmount <= 0) return 'ENTER AMOUNT';
      if (currentState.betAmount > balance) return 'INSUFFICIENT FUNDS';
      return 'INVALID BET';
    }

    if (phase === CrashGamePhase.Running) return 'GAME ACTIVE';
    if (phase === CrashGamePhase.Crashed) return 'CRASHED';
    
    return `WAITING...`;
  };

  const getButtonColor = () => {
    if (!connected || !isAuthenticated || !userId) return '#4B5563';
    if (canWithdrawState) return '#F97316';
    if (canPlaceBetState) return '#10B981';
    return '#4B5563';
  };

  const getButtonAction = () => {
    if (!isAuthenticated || !userId) return () => {};
    if (canWithdrawState) return handleWithdraw;
    if (canPlaceBetState) return handlePlaceBet;
    return () => {};
  };

  if (!isAuthenticated) {
    return (
      <div
        className="float-right w-2/5 h-[350px] border text-white p-2 flex items-center justify-center"
        style={{
          backgroundColor: 'rgb(24, 26, 30)',
          borderColor: 'rgb(41, 36, 36)',
        }}
      >
        <div className="text-center">
          <h3 className="text-xl mb-4">Login Required</h3>
          <p className="text-sm text-gray-400">
            Please log in to place bets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-110 border text-white p-4 flex flex-col"
      style={{
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)',
      }}
    >
      <div>
        <div>
          <label htmlFor="bet" className="block text-xs mb-1">
            Bet Amount (max 500,000)
          </label>
          <input
            id="bet"
            type="number"
            value={betInput}
            onChange={(e) => setBetInput(e.target.value)}
            className="h-8 w-full bg-white text-black border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Bet amount"
            disabled={phase !== CrashGamePhase.Betting || hasActiveBet || !isAuthenticated}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="autoCashOut" className="block text-xs mb-1">
            Auto Cash Out (from 1.01)
          </label>
          <input
            id="autoCashOut"
            type="number"
            value={autoCashOutInput}
            onChange={(e) => setAutoCashOutInput(e.target.value)}
            className="h-8 w-full bg-white text-black border-gray-600  p-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Multiplier e.g., 2.5"
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
      </div>

      <button
        onClick={getButtonAction()}
        disabled={loading || !connected || !isAuthenticated || (!canPlaceBetState && !canWithdrawState)}
        className=" mt-4 rounded-xl text-3xl text-white cursor-pointer h-[200px] flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        style={{
          backgroundColor: getButtonColor(),
        }}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

export default Betting;