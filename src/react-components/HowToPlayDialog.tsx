interface Props {
  onClose: () => void;
}

export function HowToPlayDialog({ onClose }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[200]" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-[#333] rounded-xl p-8 min-w-[320px] max-w-[480px] flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center">How it works</h2>
        <p className="text-base leading-relaxed text-[#ccc]">
          Each ant has 3 sensors in a slight arc in front of the ant: one directly in front, one slightly offset to the left, and another slightly offset to the right. Each sensor detects pheromones, determines the overall value of turning, then "steers" the ant in the direction with the highest value.
        </p>
        <p className="text-base font-bold text-[#ccc]">Example Scenario:</p>
        <p className="text-base leading-relaxed text-[#ccc]">
          An ant is looking for food and each sensor picks up some pheromones.
          <br />
          <br />
          The front sensor picks up some pheromones that lead to food, the right sensor picks up many pheromones that lead to food, and the left sensor picks up pheromones that lead home.
          <br />
          <br />
          The left sensor has no value, since the ant is not trying to return home. The front sensor has some value, but the right sensor has the greatest value. Therefore, the ant will move forward and turn slightly to the right.
        </p>
        <button className="btn btn-green self-center min-w-[120px]" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
