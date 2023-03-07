export default class HttpError extends Error {
    constructor(status) {
        super();
        this.status = status;
    }
}
