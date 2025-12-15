import type { NextConfig } from "next";
import path from "path";
// @ts-expect-error - next-pwa does not provide type definitions for ESM import
import withPWA from "next-pwa"; // ESM-импорт

// Опции PWA передаем ТОЛЬКО сюда
const withPWAPlugin = withPWA({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
	reactStrictMode: true,

	// Явно указываем, что используем webpack для сборки
	// (так как у нас есть настройки для SVGR и алиасов)
	turbopack: {},

	webpack: (config) => {
		// Алиас на src, чтобы @/... резолвился в CI
		config.resolve.alias["@"] = path.resolve(__dirname, "src");

		// SVGR для импорта .svg как React-компонентов
		config.module.rules.push({
			test: /\.svg$/,
			issuer: /\.[jt]sx?$/,
			use: ["@svgr/webpack"],
		});

		return config;
	},
};

export default withPWAPlugin(nextConfig);
