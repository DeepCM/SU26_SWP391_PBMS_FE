import { useState } from 'react'
import '../../styles/Review.css'

function StarRating({ value = 0, onChange, size }) {
    const [hovered, setHovered] = useState(0)
    const interactive = typeof onChange === 'function'
    const displayValue = interactive && hovered > 0 ? hovered : value

    return (
        <span
            className={`sci-star-rating ${interactive ? 'sci-star-rating--interactive' : ''}`}
            onMouseLeave={() => interactive && setHovered(0)}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`sci-star ${star <= displayValue ? 'sci-star--filled' : ''} ${interactive ? 'sci-star--interactive' : ''}`}
                    style={size ? { fontSize: size } : undefined}
                    onClick={interactive ? () => onChange(star) : undefined}
                    onMouseEnter={interactive ? () => setHovered(star) : undefined}
                >
                    {star <= displayValue ? '★' : '☆'}
                </span>
            ))}
        </span>
    )
}

export default StarRating
