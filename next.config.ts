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

		// Находим существующее правило для SVG и модифицируем его
		const fileLoaderRule = config.module.rules.find((rule: { test?: { test?: (str: string) => boolean } }) =>
			rule.test?.test?.(".svg"),
		);

		if (fileLoaderRule) {
			fileLoaderRule.exclude = /\.svg$/i;
		}

		// SVGR для импорта .svg как React-компонентов (по умолчанию)
		config.module.rules.push({
			test: /\.svg$/,
			issuer: /\.[jt]sx?$/,
			resourceQuery: { not: [/url/] }, // исключаем импорты с ?url
			use: ["@svgr/webpack"],
		});

		// Статический импорт SVG для использования в Image (с ?url)
		config.module.rules.push({
			test: /\.svg$/,
			resourceQuery: /url/, // импорты с ?url
			type: "asset/resource",
		});

		return config;
	},
};

export default withPWAPlugin(nextConfig);
