"use client";

type FlashCardProps = {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
};

export function FlashCard({ front, back, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div
      className="relative w-full max-w-3xl h-[28rem] cursor-pointer preserve-3d transition-transform duration-500 mx-auto"
      onClick={onFlip}
      style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
    >
      <div className="absolute inset-0 backface-hidden bg-surface border border-border/50 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-xl">
        <p className="text-2xl md:text-4xl text-slate-100 font-medium leading-relaxed">
          {front}
        </p>
        <p className="absolute bottom-6 text-sm text-slate-500 font-light tracking-wide">
          Tap or press Space to reveal
        </p>
      </div>

      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#121212] border border-gold/30 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl shadow-gold/5">
        <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
          {back}
        </p>
      </div>
    </div>
  );
}
