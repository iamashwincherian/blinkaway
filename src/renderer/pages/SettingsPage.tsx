import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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

export default function SettingsPage() {
  // Store durations in seconds in state
  const [workDuration, setWorkDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(120);
  const [timerCountdown, setTimerCountdown] = useState('N/A');

  useEffect(() => {
    window.ipcRenderer.send('get-settings');
    window.ipcRenderer.on('settings-data', (settings) => {
      setWorkDuration(settings.workDuration);
      setBreakDuration(settings.breakDuration);
    });
    window.ipcRenderer.on('settings-timer', (seconds) => {
      const min = Math.floor(seconds / 60);
      const sec = (seconds % 60).toString().padStart(2, '0');
      setTimerCountdown(`${min}:${sec}`);
    });
    return () => {
      window.ipcRenderer.removeAllListeners('settings-data');
      window.ipcRenderer.removeAllListeners('settings-timer');
    };
  }, []);

  // Convert seconds to minutes for display
  const workDurationMin = Math.floor(workDuration / 60);
  const breakDurationMin = Math.floor(breakDuration / 60);

  // When user edits, update state in seconds
  const handleWorkDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkDuration(Number(e.target.value) * 60);
  };
  const handleBreakDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBreakDuration(Number(e.target.value) * 60);
  };

  const handleSave = () => {
    window.ipcRenderer.send('save-settings', {
      workDuration,
      breakDuration,
    });
    window.ipcRenderer.send('close-settings');
  };
  const handleCancel = () => {
    window.ipcRenderer.send('close-settings');
  };

  return (
    <div className='p-4 h-full'>
      <title>Blinkaway Settings</title>
      <div className='flex flex-col justify-between'>
        <div>
          <div className="flex flex-col justify-center items-center bg-muted rounded-lg py-4 ">
            <div className='flex items-center justify-center space-x-2'>
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-mono font-semibold dark:text-white">{timerCountdown}</span>
              <span className="text-sm text-muted-foreground">remaining</span>
            </div>
            <span className="text-sm text-muted-foreground">For the bext break</span>
          </div>
          <div className='space-y-4 mt-4'>
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label className='text-muted-foreground' htmlFor="work-duration">Work Duration (minutes)</Label>
              <Input
                id="work-duration"
                type="number"
                className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-muted-foreground"
                style={{ MozAppearance: 'textfield' }}
                value={workDurationMin}
                onChange={handleWorkDurationChange}
                />
            </div>
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label className='text-muted-foreground' htmlFor="picture">Break Duration (minutes)</Label>
              <Input
                id="picture"
                type="number"
                className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-muted-foreground"
                style={{ MozAppearance: 'textfield' }}
                value={breakDurationMin}
                onChange={handleBreakDurationChange}
                />
            </div>
          </div>
        </div>
        <div className='mt-4 space-x-2 ml-auto'>
          <Button onClick={handleCancel} variant="outline" className='dark:text-muted-foreground border-zinc-400'>Cancel</Button>
          <Button onClick={handleSave} className='dark:bg-primary-foreground dark:text-white dark:hover:bg-zinc-900'>Save</Button>
        </div>
      </div>
    </div>
  );
} 