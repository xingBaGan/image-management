import React from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  type?: 'image' | 'video';
}

const Rating: React.FC<RatingProps> = ({ value = 0, onChange, size = 20, type = 'image' }) => {
  const { t } = useLanguage();
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hoverValue ?? value) >= star;
        return (
          <button
            key={star}
            title={`${t(type === 'video' ? 'rateVideo' : 'rateImage')} ${star}`}
            className={`transition-all duration-200 ease-in-out transform hover:scale-110 ${
              filled ? 'text-yellow-400' : 'text-gray-300 dark:text-black-600'
            }`}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange(star === value ? 0 : star)}
          >
            <Star
              size={size}
              fill={filled ? 'currentColor' : 'none'}
              className="transition-colors duration-200"
            />
          </button>
        );
      })}
    </div>
  );
};

export default Rating; 