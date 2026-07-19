import * as yup from "yup";

export const emailSchema = yup.object({
	email: yup.string().required().email(),
});

// Используется на логине: принимаем любой непустой пароль,
// правильность проверяет Firebase на сервере.
export const passwordSchema = yup.object({
	password: yup.string().required("Введите пароль"),
});

// Используется при регистрации: минимальное требование Firebase — 6 символов.
export const registerPasswordSchema = yup.object({
	password: yup.string().required("Введите пароль").min(6, "Минимум 6 символов"),
});
