import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// Правила готовности к React Compiler — компилятор в проекте не используется,
			// код с ними не приводили. Пока warn, чтобы не блокировать CI.
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/immutability": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
			// Параметр/переменная с префиксом "_" — намеренно неиспользуемые (например,
			// в моках, где важна сигнатура функции, а не тело). Не считаем их шумом.
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
	globalIgnores(["out/", ".next/", "ios/", "public/sw.js", "public/workbox-*.js", "next-env.d.ts"]),
]);
