import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
	reactStrictMode: true,

	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/,
			issuer: /\.[jt]sx?$/,
			use: ["@svgr/webpack"],
		});
		return config;
	},
};

export default withPWA({
	...nextConfig,
	dest: "public",
	disable: process.env.NODE_ENV === "development",
});
