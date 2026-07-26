class ApiError extends Error {

    constructor(
        statuscode,
        message = "something went wrong",
        errors = [],
        stack = ""
    ) {
        super(statuscode)
        this.statuscode = statuscode
        this.message = message
        this.errors = errors
        this.data = null
        this.sucess = false

        if(stack){
            this.stack = stack
        } else{
            Error.captureStackTrace(this,this.constructor)
        }


    }
}

export {ApiError}