type Flower = {
  left: string;
  top: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  breathe?: boolean;
  petals: number;
  colorA: string;
  colorB: string;
};

const FLOWERS: Flower[] = [
  { left: "6%", top: "12%", size: 84, opacity: 0.5, duration: 26, delay: 0, breathe: true, petals: 5, colorA: "var(--decor-a1, #efd3d9)", colorB: "var(--decor-a2, #e3b7a0)" },
  { left: "31%", top: "78%", size: 54, opacity: 0.4, duration: 34, delay: 2, petals: 4, colorA: "var(--decor-b1, #dde4cf)", colorB: "var(--decor-b2, #c9d3b6)" },
  { left: "82%", top: "60%", size: 100, opacity: 0.32, duration: 38, delay: 1, petals: 6, colorA: "var(--decor-d1, #ebd5dc)", colorB: "var(--decor-d2, #d9afba)" },
  { left: "68%", top: "32%", size: 30, opacity: 0.4, duration: 42, delay: 8, petals: 5, colorA: "var(--decor-e1, #e7dcea)", colorB: "var(--decor-e2, #cdbdd6)" },
  { left: "92%", top: "15%", size: 44, opacity: 0.3, duration: 36, delay: 6, breathe: true, petals: 5, colorA: "var(--decor-c1, #f3dcc9)", colorB: "var(--decor-c2, #e0c0a6)" },
];

function FlowerSvg({ size, petals, colorA, colorB }: Pick<Flower, "size" | "petals" | "colorA" | "colorB">) {
  const petalEls = Array.from({ length: petals }, (_, i) => {
    const rotate = (360 / petals) * i;
    return (
      <ellipse
        key={i}
        cx="0"
        cy="-19"
        rx="10"
        ry="19"
        transform={rotate ? `rotate(${rotate})` : undefined}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <g transform="translate(50 50)" fill={colorA}>
        {petalEls}
        <circle r="7.5" fill={colorB} />
      </g>
    </svg>
  );
}

/** Ambient floating flower motif — the app's one signature decorative flourish. */
export function DecorBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 420px at 88% -8%, var(--decor-glow-1, #f6e4e6) 0%, transparent 62%), radial-gradient(620px 380px at 4% 104%, var(--decor-glow-2, #edf0e6) 0%, transparent 60%)",
        }}
      />
      {FLOWERS.map((f, i) => (
        <div
          key={i}
          className="decor-flower absolute"
          style={{
            left: f.left,
            top: f.top,
            animation: `om-drift ${f.duration}s ease-in-out infinite ${f.delay}s`,
          }}
        >
          <div
            style={{
              opacity: f.opacity,
              animation: f.breathe ? `om-breathe ${f.duration * 0.4}s ease-in-out infinite` : undefined,
            }}
          >
            <FlowerSvg size={f.size} petals={f.petals} colorA={f.colorA} colorB={f.colorB} />
          </div>
        </div>
      ))}
    </div>
  );
}
