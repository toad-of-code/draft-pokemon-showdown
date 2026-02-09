import React from 'react';

interface SpriteProps {
    src: string;
    alt: string;
    isBack?: boolean; // If true, maybe flip it or use back sprite if available
    className?: string;
}

const Sprite: React.FC<SpriteProps> = ({ src, alt, isBack, className }) => {
    return (
        <div className={`relative ${className}`}>
            <img
                src={src}
                alt={alt}
                className={`
                    w-48 h-48 md:w-64 md:h-64 object-contain 
                    filter drop-shadow-2xl animate-float
                    ${isBack ? '' : ''} 
                `}
                style={{
                    imageRendering: 'pixelated'
                }}
            />
            {/* Shadow */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/30 blur-xl rounded-[100%] pointer-events-none" />
        </div>
    );
};

export default Sprite;
