import type { NextConfig } from 'next';
const config: NextConfig = {
  // @ts-expect-error - testing if turbopack is a valid key
  turbopack: {
    root: '..'
  }
};
console.log('Config keys:', Object.keys(config));
