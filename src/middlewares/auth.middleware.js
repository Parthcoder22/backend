import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/ayncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.models.js";

export const verifyJWT = asyncHandler((req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("authorization")?.replace("bearer ", "");

        if (!accessToken) {
            throw new ApiError(401, "unauthorized user");
        }

        const decodedToken = jwt.verify(accessToken, process.env.chaiaurcode)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token.")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid accessToken")
    }

})