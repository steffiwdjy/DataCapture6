const Joi = require("joi");

const MessageSchema = {
  createMessage(dataMessage) {
    // Skema untuk validasi satu objek Message
    const schema = Joi.object({
      Judul: Joi.string().min(3).max(255).required().messages({
        "string.min": "Judul minimal harus 3 karakter",
        "string.max": "Judul tidak boleh lebih dari 255 karakter",
        "any.required": "Judul wajib diisi",
      }),
      Pesan: Joi.string().min(3).required().messages({
        "string.min": "Pesan minimal harus 3 karakter",
        "any.required": "Pesan wajib diisi",
      }),
      TglDibuat: Joi.number().integer().min(0).required().messages({
        "number.base": "Tanggal harus berupa epoch time dalam milidetik",
        "number.min": "Tanggal tidak boleh negatif",
      }),
      UserID_dibuat: Joi.number().integer().min(1).required().messages({
        "number.base": "UserID dibuat harus berupa angka",
        "number.min": "UserID dibuat minimal 1",
        "any.required": "UserID dibuat wajib diisi",
      }),
      PesanFile: Joi.string().messages({
        "string.base": "PesanFile harus berupa string",
      }),
      AllPengurusID: Joi.array().min(1).messages({
        "array.base": "AllPengurusID harus berupa array",
        "array.min": "Penerima minimal harus ada 1",
      }),
    });

    // Validasi dataMessage berdasarkan schema
    return schema.validate(dataMessage, { abortEarly: false });
  },
};

module.exports = { MessageSchema };
