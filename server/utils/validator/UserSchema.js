const Joi = require("joi");

const UserSchema = {
    loginUser(user) {
        const schema = Joi.object({
            Email: Joi.string().email().max(200),
            NoTelp: Joi.string().min(10).max(20),
        })
            .xor("Email", "NoTelp") // Require untuk Email atau noTelp tapi tidak keduanya
            .required();

        return schema.validate(user);
    },

    registerUser(user) {
        const schema = Joi.object({
            Nama: Joi.string().max(255).required(),
            Email: Joi.string().email().max(200).allow(null, "").optional(),
            NoTelp: Joi.string().min(10).max(20).allow(null, "").optional(),
            Alamat: Joi.string().max(255).allow(null, "").optional(),
            NoUnit: Joi.string().max(255).required(),
            Role: Joi.array().items(Joi.number().required().min(1)).min(1).required(),
        }).custom((value, helpers) => {
            if (!value.Email && !value.NoTelp) {
                return helpers.message("Salah satu dari Email atau NoTelp harus diisi.");
            }
            return value;
        });

        return schema.validate(user, { abortEarly: false }); // Tampilkan semua error, tidak hanya yang pertama
    },

    updateUser(user) {
        const schema = Joi.object({
            UserID: Joi.number().integer().min(1).required(),
            Nama: Joi.string().max(255).required(),
            Email: Joi.string().email().max(200).allow(null, "").optional(),
            NoTelp: Joi.string().min(10).max(20).allow(null, "").optional(),
            Alamat: Joi.string().max(255).allow(null, "").optional(),
            NoUnit: Joi.string().max(255).required(),
            IsKetentuan: Joi.boolean(),
            Role: Joi.array()
                .items(
                    Joi.object({
                        Action: Joi.string().optional(),
                        RoleID: Joi.number().required(),
                    })
                )
                .required(),
        }).custom((value, helpers) => {
            if (!value.Email && !value.NoTelp) {
                return helpers.message("Salah satu dari Email atau NoTelp harus diisi.");
            }
            return value;
        });

        return schema.validate(user, { abortEarly: false }); // Tampilkan semua error, tidak hanya yang pertama
    },
};

module.exports = { UserSchema };
