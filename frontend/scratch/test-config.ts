import type { NextConfig } from 'next';
const config: NextConfig = {
  turbopack: {
    root: '..'
  }
};
console.log('Config keys:', Object.keys(config));
