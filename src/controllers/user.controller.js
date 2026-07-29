import { asyncHandler } from "../utils/ayncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/User.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(
    async (req, res) => {

        //   ---for registration---

        //get user detail from frontend
        //check alreay have accout
        //validation - neccessary deatil not empty
        //manage images
        //check unique field value
        //create new user for db
        //check user create in db successfully?
        //in res remove password(enecrypted),tokens
        //send res to frontend

        //server side work:-
        //timestamp
        //access token
        //refresh token

        console.log(`hey i am in user.controller.js`)

        const { username, email, password, fullName } = req.body

        if (
            [username, fullName, email, password].some(field => field?.trim() === "")
        ) {
            throw new ApiError(400, "All field are required.");
        }

        const existedUser = await User.findOne({
            $or: [{ email }, { username }],
        })

        if (existedUser) {
            throw new ApiError(409, "user with username or email already exist.")
        }

        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        let coverImageLocalPath;

        console.log("avatar from req :", avatarLocalPath);


        if (!avatarLocalPath) {
            console.log(avatarLocalPath);
            throw new ApiError(400, "Avatar file is required.")
        }

        if (Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
            coverImageLocalPath = req.files?.coverImage[0]?.path;
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        console.log("avatar from req :", avatar);

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required.")
        }


        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        if (!createdUser) {
            throw new ApiError(500, "Somthing went weong while regestering user.")
        }


        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        )
    }

)

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId);
        const accessToken = user.generateaccesstoken()
        const refreshToken = user.generaterefreshtoken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refreshtoken and accesstoken ")
    }
}


const loginUser = asyncHandler(
    async (req, res) => {
        //req body get data
        //check all fields are not empty
        //check user exist or not
        //check password is correct for username
        //refreshtoken and accesstoken generation 
        //return
        console.log(req?.body);

        const { username, password, email } = req?.body

        if (!username && !email) {
            throw new ApiError(400, "username and password required.")
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!user) {
            throw new ApiError(404, "user is not found.")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(402, "Invalid User Credential.")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -accessToken");

        const option = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json(
                new ApiResponse(200, {
                    user: loggedInUser, accessToken, refreshToken
                }, "user logged in successfully")
            )
    }
)

const logoutUser = asyncHandler(
    async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1,
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, "", "user logged out")
            )
    }
)

const refreshAccessToken = asyncHandler(
    async (req, res) => {

        console.log(req.cookies);
        console.log(req.body);
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;



        if (!incomingRefreshToken) {
            throw new ApiError(400, "unauthorised request.")
        }

        try {
            const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
            console.log(decodedRefreshToken);

            const user = await User.findById(decodedRefreshToken._id);
            console.log(user);

            if (!user) {
                throw new ApiError(401, "Invalid Refresh Token.")
            }

            if (incomingRefreshToken !== user.refreshToken) {
                throw new ApiError(402, "Refresh Token is used or expire.")
            }

            const options = {
                httpOnly: true,
                secure: true
            }

            const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

            res.status(200)
                .cookie("refreshToken", refreshToken, options)
                .cookie("accessToken", accessToken, options)
                .json(
                    new ApiResponse(
                        200,
                        { accessToken, refreshToken },
                        "Access Token refresh"
                    )
                )
        } catch (error) {
            console.log("erorr from refresh token");

            throw new ApiError(401, error?.message || "invalid Refresh Token")
        }
    }
)

const changeCurrentPassword = asyncHandler(
    async (req, res) => {
        const { updatedPassword, oldPassword } = req.body

        const user = await User.findById(req.user?._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Inavlid old password")
        }

        user.password = updatedPassword;

        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password Changed Successfully"));

    }
)

const getCurrentUser = asyncHandler(
    async (req, res) => {
        return res
            .status(200)
            .json(200, req.user, "Current User fetch successfully.")
    }
)

const updateAccountDetail = asyncHandler(
    async (req, res) => {
        const { email, fullName } = req.body;
        if (!fullName || !email) {
            throw new ApiError(400, "All fields required.")
        }

        const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set: {
                    email,
                    fullName: fullName
                }
            },
            { new: true }
        ).select("-password")

        return res.status(200).json(200, user, "Fields update successfully.")
    }
)

const updateUserAvatar = asyncHandler(
    async (req, res) => {
        const avatarLocalPath = req.file?.path

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing.")
        }


        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if (!avatar.url) {
            throw new ApiError(500, "Error while uploading avatar.")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {
                new: true
            }
        ).select("-password")

        return res.status(200).json(200, user, "Avatar is updated successfully.")
    }
)

const updateUserCoverImage = asyncHandler(
    async (req, res) => {
        const coverImageLocalPath = req.file?.path

        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover Image file is missing.")
        }


        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!coverImage.url) {
            throw new ApiError(500, "Error while uploading cover image.")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {
                new: true
            }
        ).select("-password")

        return res.status(200).json(200, user, "Cover Image is updated successfully.")
    }
)

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetail, updateUserAvatar }