class apiError extends Error{
    constructor(
        status,
        message,
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = status;
        this.status = status;
        this.message = message;
        this.data = null;
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, apiError);
        }

    }
};

export default apiError;