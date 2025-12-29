import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    setRating?: (r: number) => void;
    interactive?: boolean;
}

export const StarRating = ({ rating, setRating, interactive = false }: StarRatingProps) => {
    const [hover, setHover] = useState(0);
    const labels = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`transition-all duration-200 ${interactive ? 'hover:scale-125' : 'cursor-default'}`}
                        onClick={() => interactive && setRating?.(star)}
                        onMouseEnter={() => interactive && setHover(star)}
                        onMouseLeave={() => interactive && setHover(0)}
                    >
                        <Star
                            className={`h-10 w-10 ${star <= (hover || rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                        />
                    </button>
                ))}
            </div>
            {interactive && <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{labels[hover || rating] || "Tap to rate"}</span>}
        </div>
    );
};