"use client";

const PIECES = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 9) * 0.045}s`,
  duration: `${1.8 + (index % 7) * 0.12}s`,
  rotate: `${(index * 53) % 360}deg`,
}));

export function CelebrationConfetti() {
  return (
    <div className="celebration-confetti" aria-hidden="true">
      {PIECES.map((piece) => (
        <i
          key={piece.id}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            rotate: piece.rotate,
          }}
        />
      ))}
    </div>
  );
}
