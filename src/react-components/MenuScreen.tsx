import { useState } from "react";
import { HowToPlayDialog } from "./HowToPlayDialog";
import { SettingsPanel } from "./SettingsPanel";

interface Props {
  onStart: () => void;
}

export function MenuScreen({ onStart }: Props) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/75 z-[100]">
      <div className="flex flex-col items-center gap-8">
        <h1 className="font-bold flex flex-col items-center">
          <span className="text-8xl">ANT</span>
          <span className="text-3xl">SIMULATOR</span>
        </h1>

        <img src="/ant.svg" alt="Ant" className="w-[100px] h-auto" />

        <div className="flex flex-col gap-4">
          <button className="btn btn-primary" onClick={onStart}>
            Start Simulation
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowHowToPlay(true)}
          >
            How it Works
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowSettings(true)}
          >
            Options
          </button>
        </div>
      </div>

      {showHowToPlay && <HowToPlayDialog onClose={() => setShowHowToPlay(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
