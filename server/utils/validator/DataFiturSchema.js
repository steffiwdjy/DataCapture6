const Joi = require("joi");

const DataFiturSchema = {
  createDataFitur(dataFitur) {
    // Skema untuk validasi satu objek DataFitur
    const schema = Joi.object({
      FiturID: Joi.number().integer().min(1).required(),
      Judul: Joi.string().min(3).max(255).required(),
      TglDibuat: Joi.number().integer().min(0).required(),
      UserID_dibuat: Joi.number().integer().min(1).required(),
      FileFolder: Joi.alternatives()
        .try(
          Joi.array().min(1).messages({
            "array.base": "FileFolder harus berupa array",
            "array.min": "Minimal harus ada 1 file",
          }),
          Joi.string() // Allow FileFolder to be a string
        )
        .required()
        .messages({
          "any.required": "File wajib diisi",
        }),
      UserTujuan: Joi.array().items(Joi.number().integer().min(1)).min(1).required(), // Array berisi userID tujuan, minimal ada 1
    });

    // Validasi dataFitur berdasarkan schema
    return schema.validate(dataFitur, { abortEarly: false });
  },
};

module.exports = { DataFiturSchema };
