/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['antd', 'rc-util', 'rc-pagination', 'rc-picker', 'rc-tree', 'rc-table', 'rc-input', '@ant-design/icons-svg'], // Add other rc-* or antd related packages if needed
};

export default nextConfig;
