import React from 'react';
import boosterStandard from './assets/boosters/booster-standard.png';
import boosterPotw from './assets/boosters/booster-potw.png';
import boosterSpecial from './assets/boosters/booster-special.png';
import boosterCraftable from './assets/boosters/booster-craftable.png';

/**
 * Official eFootball Hexagon Booster Icon with authentic graphics & neon glow
 * Images: Standard (Cyan), POTW (Green), Special (Purple), Craftable (Gold)
 */
export default function BoosterHexagonIcon({
    color = '#00f2fe',
    type = null,
    size = 24,
    onClick,
    title,
    style = {},
    disabled = false,
    glow = true
}) {
    // Determine which booster image and neon color to use
    let src = boosterStandard;
    let neonColor = '#00f2fe';

    const t = (type || '').toString().toUpperCase().trim();
    const c = (color || '').toString().toLowerCase().trim();

    if (t === 'POTW' || t === 'GREEN' || c.includes('22c55e') || c.includes('4ade80') || c.includes('green')) {
        src = boosterPotw;
        neonColor = '#22c55e';
    } else if (t === 'SPECIAL' || t === 'PURPLE' || t === 'NAMED' || c.includes('a855f7') || c.includes('c084fc') || c.includes('purple')) {
        src = boosterSpecial;
        neonColor = '#c084fc';
    } else if (t === 'CRAFTABLE' || t === 'TOTAL_PACKAGE' || t === 'GOLD' || t === 'YELLOW' || c.includes('fbbf24') || c.includes('eab308') || c.includes('yellow') || c.includes('gold')) {
        src = boosterCraftable;
        neonColor = '#fbbf24';
    } else if (t === 'STANDARD' || t === 'BLUE' || t === 'CYAN' || c.includes('00f2fe') || c.includes('38bdf8') || c.includes('cyan') || c.includes('blue')) {
        src = boosterStandard;
        neonColor = '#00f2fe';
    } else {
        // Fallback default
        src = boosterStandard;
        neonColor = '#00f2fe';
    }

    const [isHovered, setIsHovered] = React.useState(false);

    // Compute neon filter
    let filterStyle = 'none';
    if (disabled) {
        filterStyle = 'grayscale(1) opacity(0.35)';
    } else if (glow) {
        if (isHovered && onClick) {
            filterStyle = `drop-shadow(0 0 5px ${neonColor}) drop-shadow(0 0 12px ${neonColor})`;
        } else {
            filterStyle = `drop-shadow(0 0 3px ${neonColor}) drop-shadow(0 0 8px ${neonColor})`;
        }
    }

    // Height based on native aspect ratio (approx 401x349 => 1.15:1 width-to-height)
    const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 24;
    const computedHeight = Math.round(numericSize * (349 / 401));

    return (
        <img
            src={src}
            alt={title || "Booster"}
            title={title}
            onClick={disabled ? undefined : onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: `${numericSize}px`,
                height: `${computedHeight}px`,
                objectFit: 'contain',
                display: 'inline-block',
                verticalAlign: 'middle',
                filter: filterStyle,
                cursor: onClick && !disabled ? 'pointer' : 'default',
                transform: isHovered && onClick && !disabled ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.18s ease, filter 0.18s ease',
                flexShrink: 0,
                userSelect: 'none',
                ...style
            }}
        />
    );
}
