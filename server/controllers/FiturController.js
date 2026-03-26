const { FiturRepository } = require("../database/repositories");
// const { Validator } = require("../utils/validator");

class FiturController {
    static async getAll(req, res) {
        try {
            let readFitur = await FiturRepository.readAll();
            res.status(200).json(readFitur);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            let readFitur = await FiturRepository.readOne(req.params.id);
            res.status(200).json(readFitur);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async getAllByUserID(req, res) {
        try {
            let readFitur = await FiturRepository.readFiturByUserID();
            res.status(200).json(readFitur);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = { FiturController };
