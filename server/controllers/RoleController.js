const { RoleRepository } = require("../database/repositories");

class RoleController {
    static async getAll(req, res) {
        try {
            let readUser = await RoleRepository.readAll();
            res.status(200).json(readUser);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            let readUser = await RoleRepository.readOne(req.params.id);
            res.status(200).json(readUser);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

module.exports = { RoleController };
