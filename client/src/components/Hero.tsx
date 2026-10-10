import type { FC } from 'react';
import { Camera, Compass, Leaf, MapPin, Moon, Sparkles } from 'lucide-react';

interface HeroProps {
  onTriggerIdentify: () => void;
}

export const Hero: FC<HeroProps> = ({ onTriggerIdentify }) => {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="pulse" /> YOUR NEXT ADVENTURE STARTS OUTSIDE
        </div>
        <h1>
          The world is full
          <br />
          of <em>discoveries.</em>
        </h1>
        <p>
          Spot something fascinating. Let multimodal AI identify it instantly.
          Turn every walk into a collectible field discovery card you can keep and share.
        </p>
        <div className="hero-actions">
          <button className="button primary" onClick={onTriggerIdentify}>
            <Camera size={18} /> Identify a discovery
          </button>
          <a className="button ghost" href="#collection">
            View collection <span>↓</span>
          </a>
        </div>
        <div className="hero-foot">
          <span>
            <MapPin size={14} /> Location & weather aware
          </span>
          <span>
            <Moon size={14} /> Built for curious explorers
          </span>
        </div>
      </div>

      <div className="hero-art">
        <div className="sun-orb" />
        <div className="art-label label-top">
          <Sparkles size={14} /> REAL-WORLD DISCOVERIES
        </div>
        <div className="specimen specimen-one">
          <span>01 / FLORA</span>
          <div className="leaf-art">
            <Leaf size={76} />
          </div>
          <b>Notice the details.</b>
        </div>
        <div className="specimen specimen-two">
          <span>FIELD NOTE · 002</span>
          <div className="mini-bug">✳</div>
          <b>Every find tells a story.</b>
        </div>
        <div className="art-stamp">
          GO
          <br />
          WILD
          <span>✳</span>
        </div>
        <div className="art-label label-bottom">
          <Compass size={15} /> LOOK CLOSER. WANDER FURTHER.
        </div>
      </div>
    </section>
  );
};
