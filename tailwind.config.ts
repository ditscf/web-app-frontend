import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: '#0F3D91',
        gold: '#F4B400',
        navy: '#07142F',
        ink: '#0B1020',
      },
      boxShadow: {
        premium: '0 24px 80px rgba(7, 20, 47, 0.22)',
        glow: '0 0 80px rgba(244, 180, 0, 0.28)',
      },
      backgroundImage: {
        'royal-radial':
          'radial-gradient(circle at top left, rgba(244,180,0,0.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(15,61,145,0.38), transparent 34%)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 24s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
