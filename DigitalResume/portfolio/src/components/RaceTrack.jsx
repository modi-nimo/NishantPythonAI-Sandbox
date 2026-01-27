import React, { useRef, useEffect, useState } from 'react';

const RaceTrack = ({ scrollPercentage, isDarkMode }) => {
    const pathRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0, angle: 0 });

    // Safety check for server-side rendering or initial load
    const safeScroll = Math.max(0, Math.min(1, scrollPercentage));

    // The SVG Path Definition (Wavy vertical line)
    // We'll define it relative to a 100x1000 coordinate system (width x height)
    // This allows us to scale it easily via CSS.
    // M 50 0 (Start Top Center)
    // C 100 200, 0 300, 50 500 (Curve 1)
    // S 0 800, 50 1000 (Curve 2)
    const pathD = "M 50 10 C 90 200, 10 300, 50 500 S 10 800, 50 990";

    useEffect(() => {
        if (pathRef.current) {
            const path = pathRef.current;
            const pathLength = path.getTotalLength();

            // Calculate current point based on scroll percentage
            const pointCurrent = path.getPointAtLength(safeScroll * pathLength);

            // Calculate a point slightly ahead to determine rotation angle
            // Lookahead distance (e.g., 5 units)
            const lookAheadDist = 5;
            const pointAhead = path.getPointAtLength(Math.min((safeScroll * pathLength) + lookAheadDist, pathLength));

            // Calculate Angle
            const dx = pointAhead.x - pointCurrent.x;
            const dy = pointAhead.y - pointCurrent.y;
            // atan2(y, x) gives angle. We want 0deg to be pointing DOWN (+Y).
            // Standard atan2 is 0 at Right (+X).
            // So relative to +Y axis... easier to just use standard rotation and offset.
            // angle in rads
            const angleRad = Math.atan2(dy, dx);
            let angleDeg = angleRad * (180 / Math.PI);

            setPosition({
                x: pointCurrent.x,
                y: pointCurrent.y,
                angle: angleDeg
            });
        }
    }, [safeScroll]);

    // Milestones definitions (approximate percentage positions)
    const milestonesData = [
        { id: 'start', label: 'START', pct: 0.02, target: 'top' },
        { id: 'focus', label: 'FOCUS', pct: 0.15, target: 'about' },
        { id: 'work', label: 'WORK', pct: 0.35, target: 'projects' },
        { id: 'career', label: 'CAREER', pct: 0.55, target: 'experience' },
        { id: 'tech', label: 'TECH', pct: 0.75, target: 'tech' },
        { id: 'certs', label: 'CERTS', pct: 0.85, target: 'certs' },
        { id: 'contact', label: 'CONTACT', pct: 0.98, target: 'contact' },
    ];

    const [milestones, setMilestones] = useState(milestonesData);

    // Calculate milestone positions on mount
    useEffect(() => {
        if (pathRef.current) {
            const path = pathRef.current;
            const len = path.getTotalLength();

            const calculated = milestonesData.map(m => {
                const point = path.getPointAtLength(m.pct * len);
                return { ...m, x: point.x, y: point.y };
            });
            setMilestones(calculated);
        }
    }, []);

    const scrollToSection = (target) => {
        if (target === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const element = document.getElementById(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="fixed right-0 top-0 w-32 md:w-48 h-screen z-40 flex flex-col items-center hidden md:flex pointer-events-none">
            {/* Container for the Track SVG */}
            <svg
                viewBox="0 0 100 1000"
                preserveAspectRatio="none"
                className="h-full w-full opacity-50 pointer-events-none"
            >
                {/* The Track Line */}
                <path
                    ref={pathRef}
                    d={pathD}
                    fill="none"
                    stroke={isDarkMode ? '#3b82f6' : '#2563eb'}
                    strokeWidth="2"
                    strokeDasharray="5, 10" // Dotted line effect
                    strokeOpacity="0.3"
                />
            </svg>

            {/* Render Milestones aligned to the track */}
            {milestones.map((m) => {
                const isActive = safeScroll >= m.pct;
                // Default to center if X calculation hasn't happened yet (SSR/Initial)
                const leftPos = m.x ? `${m.x}%` : '50%';

                return (
                    <div
                        key={m.id}
                        onClick={() => scrollToSection(m.target)}
                        className={`absolute flex items-center justify-end transition-all duration-500 cursor-pointer pointer-events-auto group
                        ${isActive ? 'opacity-100 scale-110' : 'opacity-30 scale-90 hover:opacity-100'}`}
                        // Use calculated X (converted to %) and Y (pct * 100%)
                        style={{
                            left: leftPos,
                            top: `${m.pct * 100}%`,
                            transform: 'translate(-100%, -50%)', // Shift left so dot is on line
                            // We want the dot to be at 'leftPos', so the text container should be to the left of that.
                            // Actually, if leftPos is the center of the line:
                            // We want dot to be centered there.
                            // So translate(-100%, -50%) aligns the right edge of CONTAINER to the line.
                        }}
                    >
                        <span className={`text-[10px] font-bold tracking-widest mr-3 whitespace-nowrap group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {m.label}
                        </span>
                        <div
                            className={`w-3 h-3 rounded-full ring-2 ring-offset-2 transition-all group-hover:scale-125 -mr-1.5
                            ${isActive ? 'bg-blue-500 ring-blue-500' : 'bg-zinc-400 ring-transparent'}
                            ${isDarkMode ? 'ring-offset-black' : 'ring-offset-white'}`}
                        />
                    </div>
                )
            })}

            {/* The Car (Positioned Absolutely based on calculated X/Y) */}
            <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none will-change-transform"
                style={{
                    // We're converting SVG coordinates (0..100, 0..1000) to % of container dimensions
                    // X: 0..100 => 0%..100%
                    // Y: 0..1000 => 0%..100%
                    transform: `translate(${position.x}%, ${position.y / 10}%)`
                    // Note: Y is divided by 10 because SVG height is 1000 but percent is 0..100
                }}
            >
                {/* Inner container for rotation and centering */}
                <div
                    className="w-10 h-20 transition-transform duration-75 ease-linear"
                    style={{
                        transform: `translate(-50%, -50%) rotate(${position.angle + 90}deg)`,
                    }}
                >
                    {/* Top-Down Car SVG */}
                    <svg viewBox="0 0 40 80" className="w-full h-full drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]">
                        <defs>
                            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                {/* Ruby Velvet Gradient */}
                                <stop offset="0%" stopColor={isDarkMode ? "#f43f5e" : "#be123c"} />
                                <stop offset="100%" stopColor={isDarkMode ? "#9f1239" : "#881337"} />
                            </linearGradient>
                        </defs>

                        {/* Tires */}
                        <rect x="0" y="10" width="4" height="12" rx="2" fill="#111" />
                        <rect x="36" y="10" width="4" height="12" rx="2" fill="#111" />
                        <rect x="0" y="58" width="4" height="12" rx="2" fill="#111" />
                        <rect x="36" y="58" width="4" height="12" rx="2" fill="#111" />

                        {/* Main Body */}
                        <path d="M4,15 Q4,5 20,5 Q36,5 36,15 V65 Q36,75 20,75 Q4,75 4,65 Z" fill="url(#bodyGrad)" />

                        {/* Windshield */}
                        <path d="M5,25 Q20,20 35,25 L34,35 Q20,32 6,35 Z" fill={isDarkMode ? "#ddd" : "#888"} />

                        {/* Roof */}
                        <rect x="6" y="36" width="28" height="20" rx="2" fill="url(#bodyGrad)" />

                        {/* Sunroof */}
                        <rect x="10" y="38" width="20" height="12" rx="1" fill="#111" stroke={isDarkMode ? "#fda4af" : "#fecdd3"} strokeWidth="0.5" />

                        {/* Rear Window */}
                        <path d="M7,57 Q20,60 33,57 L34,68 Q20,70 6,68 Z" fill="#111" />

                        {/* Headlights */}
                        <path d="M5,7 Q10,7 12,12 L5,14 Z" fill="#22d3ee" className="animate-pulse" />
                        <path d="M35,7 Q30,7 28,12 L35,14 Z" fill="#22d3ee" className="animate-pulse" />

                        {/* Tail lights */}
                        <rect x="5" y="73" width="6" height="2" rx="1" fill="#ef4444" />
                        <rect x="29" y="73" width="6" height="2" rx="1" fill="#ef4444" />
                    </svg>
                </div>
            </div>

        </div>
    );
};

export default RaceTrack;
