class ApiError extends Error {

    constructor(
        statuscode,
        message = "something went wrong",
        errors = [],
        statck = ""
    ) {
        super(statuscode)
        this.statuscode = statuscode
        this.message = message
        this.errors = errors
        this.data = null
        this.sucess = false

        if(statck){
            this.stack = statck
        } else{
            Error.captureStackTrace(this,this.constructor)
        }


    }
}

export {ApiError}