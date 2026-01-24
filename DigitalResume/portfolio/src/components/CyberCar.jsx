import React, { useMemo } from 'react';

const CyberCar = ({ scrollPercentage, isDarkMode }) => {
    // Use useMemo to avoid recalculating on every render if props haven't changed
    const transformStyle = useMemo(() => {
        // 1. Vertical Movement: Map scroll 0..1 to Viewport Height 10vh..90vh
        // We start a bit down and end near bottom
        const startY = 10;
        const endY = 90;
        const positionY = startY + (scrollPercentage * (endY - startY));

        // 2. Horizontal Movement (S-Shape): Sine wave
        // Center is 50vw. Amplitude is how wide the S is. Frequency is how many curves.
        // We want maybe 2 full curves across the page length.
        const amplitude = 35; // 35vw swing to left/right
        const frequency = 3 * Math.PI; // 1.5 cycles
        // Offset phase so we start in center or slightly left
        const positionX = 50 + amplitude * Math.sin(scrollPercentage * frequency);

        // 3. Rotation (Steering): Derivative of the Sine wave
        // The "slope" of the movement determines where the nose points.
        // Derivative of sin(kx) is k*cos(kx).
        // We dampen it so the car doesn't spin wildly.
        const rotationAmplitude = 25; // Max rotation in degrees
        const rotation = rotationAmplitude * Math.cos(scrollPercentage * frequency);

        return {
            transform: `translate(${positionX}vw, ${positionY}vh) rotate(${rotation}deg)`,
            // We need to center the car on its coordinate, so we subtract half its size in CSS or here.
            // Easiest is to just translate. Rotation happens around center.
        };
    }, [scrollPercentage]);

    return (
        <div
            className="fixed top-0 left-0 z-50 pointer-events-none will-change-transform"
            style={{
                ...transformStyle,
                transition: 'transform 0.1s ease-out', // Smooth out the scroll steps slightly
                width: '12rem', // Match internal SVG width approximate
                height: '4rem',
                marginLeft: '-6rem', // Center anchor X
                marginTop: '-2rem'   // Center anchor Y
            }}
        >
            <div className="relative w-full h-full animate-hover">
                {/* Glow Effect */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 blur-md rounded-full transition-colors duration-500
          ${isDarkMode ? 'bg-blue-500/50' : 'bg-blue-600/30'}`} />

                {/* Car SVG */}
                <svg viewBox="0 0 200 80" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <linearGradient id="carBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={isDarkMode ? "#0ea5e9" : "#2563eb"} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={isDarkMode ? "#3b82f6" : "#1d4ed8"} stopOpacity="0.4" />
                        </linearGradient>
                    </defs>

                    {/* Rear Wheel (Hover node) */}
                    <circle cx="40" cy="65" r="8" className={`fill-transparent stroke-2 ${isDarkMode ? 'stroke-blue-400' : 'stroke-blue-600'}`} />
                    <circle cx="40" cy="65" r="4" className={`fill-current ${isDarkMode ? 'text-blue-500' : 'text-blue-700'} animate-pulse`} />

                    {/* Front Wheel (Hover node) */}
                    <circle cx="160" cy="65" r="8" className={`fill-transparent stroke-2 ${isDarkMode ? 'stroke-blue-400' : 'stroke-blue-600'}`} />
                    <circle cx="160" cy="65" r="4" className={`fill-current ${isDarkMode ? 'text-blue-500' : 'text-blue-700'} animate-pulse`} />

                    {/* Main Body Chassis */}
                    <path d="M10,60 L20,50 L50,45 L140,45 L180,50 L195,60 H10 Z" fill="url(#carBodyGradient)" />

                    {/* Cabin / Glass */}
                    <path d="M55,45 L70,25 H130 L150,45 H55 Z" className={`fill-current ${isDarkMode ? 'text-white/10' : 'text-black/5'}`} />

                    {/* Tech Lines Details */}
                    <path d="M20,50 L180,50" className={`fill-none stroke-1 ${isDarkMode ? 'stroke-blue-300/30' : 'stroke-blue-900/10'}`} />

                    {/* Rear Light Stream */}
                    <path d="M10,55 L5,55" className="stroke-red-500 stroke-2 animate-pulse" />

                    {/* Front Headlight */}
                    <path d="M190,58 L198,58" className="stroke-cyan-300 stroke-2 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </svg>

                {/* Vertical/Diagonal Speed lines trailing (Rotated with car) */}
                <div className="absolute top-1/2 -left-10 w-24 h-full -z-10 opacity-0 md:opacity-100">
                    <div className={`h-[1px] w-full mb-1 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-600/10'}`} style={{ animation: 'wind 1s infinite linear' }} />
                </div>
            </div>

            <style jsx>{`
        @keyframes hover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-hover {
          animation: hover 2s ease-in-out infinite;
        }
        @keyframes wind {
           0% { transform: translateX(20px); opacity: 0; }
           50% { opacity: 1; }
           100% { transform: translateX(-20px); opacity: 0; }
        }
      `}</style>
        </div>
    );
};

export default CyberCar;
