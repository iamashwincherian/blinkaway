import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';

declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export default function BreakOverlay() {
  const [breakTime, setBreakTime] = useState(120);
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(3);

  useEffect(() => {
    window.ipcRenderer.on('break-timer', (seconds) => {
      setBreakTime(seconds);
    });
    // Countdown for skip button
    let timer: NodeJS.Timeout;
    let countdown = 3;
    setSkipCountdown(countdown);
    timer = setInterval(() => {
      countdown -= 1;
      setSkipCountdown(countdown);
      if (countdown === 0) {
        setSkipEnabled(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => {
      window.ipcRenderer.removeAllListeners('break-timer');
      clearInterval(timer);
    };
  }, []);

  const handleSkip = () => {
    window.ipcRenderer.send('skip-break');
  };

  const min = Math.floor(breakTime / 60);
  const sec = (breakTime % 60).toString().padStart(2, '0');

  return (
    <div
      id="break-overlay"
      className="fixed w-screen h-screen bg-[#4A9782] text-white flex flex-col items-center justify-center z-[9999] opacity-80 dark:opacity-100"
    >
      <p className='text-4xl mb-4 font-bold'>{min}:{sec}</p>
      <hr className='my-2 w-96 border' />
      <h1 className='text-6xl font-bold text-zinc-800 my-2'>Blink your eyes and take rest</h1>
      <Button
        className='mt-6 bg-white border-none disabled:bg-[#bcecb5]/50 text-primary'
        onClick={handleSkip}
        size="lg"
        variant="outline"
        disabled={!skipEnabled}
      >
        {skipEnabled ? 'Skip Break' : `Skip Break in .. ${skipCountdown}`}
      </Button>
    </div>
  );
} 