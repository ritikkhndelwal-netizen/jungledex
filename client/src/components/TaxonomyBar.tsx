import { type FC } from 'react';
import { Discovery } from '../types';

interface TaxonomyBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  cards: Discovery[];
}

export const TAXONOMY_CATEGORIES = [
  { id: 'All', label: 'All Discoveries', icon: '✦' },
  { id: 'Landscape/Vista', label: 'Landscapes & Sunsets', icon: '🌅' },
  { id: 'Waterscape', label: 'Waterfalls & Waters', icon: '🌊' },
  { id: 'Garden/Sanctuary', label: 'Gardens & Parks', icon: '🏡' },
  { id: 'Flora', label: 'Plants & Trees', icon: '🌿' },
  { id: 'Avian', label: 'Birds', icon: '🦅' },
  { id: 'Insect', label: 'Insects & Pollinators', icon: '🦋' },
  { id: 'Fungi', label: 'Fungi & Mushrooms', icon: '🍄' },
  { id: 'Fauna', label: 'Wildlife & Animals', icon: '🦊' },
];

export const TaxonomyBar: FC<TaxonomyBarProps> = ({
  selectedCategory,
  onSelectCategory,
  cards,
}) => {
  return (
    <div className="taxonomy-container">
      <div className="taxonomy-scroll">
        {TAXONOMY_CATEGORIES.map((cat) => {
          const count =
            cat.id === 'All'
              ? cards.length
              : cards.filter((c) =>
                  c.category.toLowerCase().includes(cat.id.toLowerCase())
                ).length;

          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              className={`taxonomy-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="tax-icon">{cat.icon}</span>
              <span className="tax-label">{cat.label}</span>
              <span className="tax-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
