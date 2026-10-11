import { type FC } from 'react';
import {
  Sparkles,
  Sun,
  Waves,
  Trees,
  Leaf,
  Bird,
  Bug,
  Sprout,
  Footprints,
  LucideIcon,
} from 'lucide-react';
import { Discovery } from '../types';

interface TaxonomyBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  cards: Discovery[];
}

export const TAXONOMY_CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'All', label: 'All Discoveries', icon: Sparkles },
  { id: 'Landscape/Vista', label: 'Landscapes & Sunsets', icon: Sun },
  { id: 'Waterscape', label: 'Waterfalls & Waters', icon: Waves },
  { id: 'Garden/Sanctuary', label: 'Gardens & Parks', icon: Trees },
  { id: 'Flora', label: 'Plants & Trees', icon: Leaf },
  { id: 'Avian', label: 'Birds', icon: Bird },
  { id: 'Insect', label: 'Insects & Pollinators', icon: Bug },
  { id: 'Fungi', label: 'Fungi & Mushrooms', icon: Sprout },
  { id: 'Fauna', label: 'Wildlife & Animals', icon: Footprints },
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
          const IconComp = cat.icon;

          return (
            <button
              key={cat.id}
              className={`taxonomy-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="tax-icon">
                <IconComp size={13} />
              </span>
              <span className="tax-label">{cat.label}</span>
              <span className="tax-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
