// const asyncHandler = (fn) => {
//     (req, res, next) => {
//         try {
//             await fn(req, res, next)
//         } catch (error) {
//             res.status(error.code || 500).json({
//                 success: false,
//                 message: error.message
//             })
//         }
//     }
// }

function asyncHandler(requestHadler) {
    (req, res, next) => {
        Promise.resolve(requestHadler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }