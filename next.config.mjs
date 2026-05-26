/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer & bwip-js are heavy Node libraries used only on the
  // server (PDF + barcode generation). Mark them external so Next does not try
  // to bundle them into the serverless function in a way that breaks them.
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'bwip-js'],
    // Tree-shake import dari paket besar -> bundle client lebih kecil & cepat.
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
