import * as yup from "yup";

export const emailSchema = yup.object({
	email: yup.string().required().email(),
});

export const passwordSchema = yup.object({
	password: yup.string().required("Введите пароль"),
});
