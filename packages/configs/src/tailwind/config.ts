import { type Config } from 'tailwindcss';
import { animation } from './styles/main/themes/animation';
import { colors, backgroundImage, gradientColorStops } from './styles/main/themes/colors';
import { fontFamily, fontSize } from './styles/main/themes/fonts';

export default {
  prefix: 'tw-',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        extension: '405px',
        xs: '500px',
        xxs: '425px',
      },
      aspectRatio: {
        card: '1.7736',
      },
      transitionProperty: {
        width: 'width',
      },
      keyframes: {
        'reverse-spin': {
          from: {
            transform: 'rotate(360deg)',
          },
        },
      },
      fontSize: {
        xxs: ['10px', '13.5px'],
      },
      gridTemplateColumns: {
        auto: 'repeat(auto-fit, minmax(4em, 1fr))',
      },
      borderWidth: {
        1: '1px',
      },
      spacing: {
        1: '0.35em',
      },
      fontFamily,
      animation,
      gradientColorStops,
      backgroundImage,
      colors,
      boxShadowColor: {
        sh1: 'var(--s1)',
      },
      boxShadow: {
        sq: '0px 0px 20px 20px var(--s1), 25px 0px 20px -20px var(--s1), 0px 25px 20px -20px var(--s1), -25px 0px 20px -20px var(--s1)',
      },
    },
  },
  plugins: [
    require('tailwindcss'),
    require('precss'),
    require('autoprefixer'),
    require('tailwindcss-3d'),
    require('@tailwindcss/container-queries'),
  ],
} satisfies Config;
