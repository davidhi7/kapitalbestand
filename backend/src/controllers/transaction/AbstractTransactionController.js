import createError from 'http-errors';

export default class AbstractTransactionController {

    constructor(model) {
        this.model = model;
    }

    async delete(user, id) {
        const instance = await this.getByUserAndId(user, id);
        await instance.destroy();
    }

    async getByUserAndId(user, id) {
        const instance = await this.model.findOne({
            where: {
                id: id,
                UserId: user.id
            }
        });
        if (!instance) {
            throw createError[404]();
        }
        return instance;
    }

}
