/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Explicitly exclude Supabase functions from the build
  webpack: (config, { isServer }) => {
    // Add a rule to ignore Supabase functions
    config.module.rules.push({
      test: /supabase\/functions\//,
      loader: 'ignore-loader',
    });
    
    return config;
  },
}

export default nextConfig
