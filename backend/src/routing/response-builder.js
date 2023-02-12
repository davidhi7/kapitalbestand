export default function ResponseBuilder({ status = 'success', error, data }) {
    /**
     * Create a uniform API response payload. A `status` of `success` or `error` is always required.
     * Additionally there may be an `error object` if `status` == 'error' and a `data` object.
     */
    /*
    If input validation fails, always return a valid result since this function is used at the end of the existing error handling chain
    */
    if (!['success', 'error'].includes(status)) {
        return {
            status: 'error',
            error: 'invalid response status provided'
        };
    }
    const response = { status };
    if (status === 'error' && error) {
        response.error = error;
    }
    if (data) {
        response.data = data;
    }
    return response;
}
