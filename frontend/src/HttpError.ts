export default class HttpError extends Error {
    status: number;

    constructor(status: number) {
        super();
        this.status = status;
    }
}
