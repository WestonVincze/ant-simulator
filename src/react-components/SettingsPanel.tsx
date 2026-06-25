import { useState } from "react";
import { settings } from "../settings";

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [startingAnts, setStartingAnts] = useState(settings.startingAnts);
  const [foodCount, setFoodCount] = useState(settings.foodCount);
  const [antSpawnRate, setAntSpawnRate] = useState(settings.antSpawnRate);

  const handleSave = () => {
    settings.startingAnts = startingAnts;
    settings.foodCount = foodCount;
    settings.antSpawnRate = antSpawnRate;
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[200]" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-[#333] rounded-xl p-8 min-w-[320px] max-w-[480px] flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center">Settings</h2>

        <label className="flex flex-col gap-1.5 text-base">
          <span>Starting Ants</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={500}
              value={startingAnts}
              onChange={e => setStartingAnts(Number(e.target.value))}
              className="flex-1 accent-green-400"
            />
            <span className="min-w-[3rem] text-right tabular-nums">{startingAnts}</span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-base">
          <span>Food Count</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={500}
              value={foodCount}
              onChange={e => setFoodCount(Number(e.target.value))}
              className="flex-1 accent-green-400"
            />
            <span className="min-w-[3rem] text-right tabular-nums">{foodCount}</span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-base">
          <span>Ant Spawn Rate</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={30}
              value={antSpawnRate}
              onChange={e => setAntSpawnRate(Number(e.target.value))}
              className="flex-1 accent-green-400"
            />
            <span className="min-w-[3rem] text-right tabular-nums">{antSpawnRate}s</span>
          </div>
        </label>

        <button className="btn btn-green self-center min-w-[120px]" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
