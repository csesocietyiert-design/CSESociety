import React from 'react';

export default function BlobAnimation() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>{`
            @keyframes blob-animation {
              0%, 100% {
                d: path('M300,200 Q400,100 500,150 Q600,100 700,200 Q800,300 700,400 Q600,500 500,450 Q400,500 300,400 Q200,300 300,200');
              }
              25% {
                d: path('M320,180 Q420,80 550,120 Q680,70 720,220 Q800,350 680,420 Q550,520 480,460 Q350,510 280,400 Q180,280 320,180');
              }
              50% {
                d: path('M280,150 Q380,120 520,100 Q650,140 750,250 Q820,380 700,470 Q520,560 420,480 Q280,420 240,280 Q200,150 280,150');
              }
              75% {
                d: path('M310,170 Q410,90 600,110 Q720,120 760,280 Q800,420 650,480 Q480,540 360,430 Q210,300 310,170');
              }
            }
          `}</style>
          <filter id="blur-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
        </defs>
        <path
          d="M300,200 Q400,100 500,150 Q600,100 700,200 Q800,300 700,400 Q600,500 500,450 Q400,500 300,400 Q200,300 300,200"
          fill="url(#gradient1)"
          opacity="0.6"
          filter="url(#blur-filter)"
          style={{
            animation: 'blob-animation 8s ease-in-out infinite',
          }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
