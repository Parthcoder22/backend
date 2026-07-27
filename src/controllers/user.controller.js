import { asyncHandler } from "../utils/ayncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/User.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

        const { username, password, email } = req.body

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

        const logedInUser = await User.findById(user._id).select("-password -accesstoken");

        const option = {
            httponly: true,
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
        await User.findByIdAndDelete(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined,
                }
            },
            {
                new: true
            }
        )

        const options = {
            httponly: true,
            secure: true
        }

        return res.status(200)
            .clearcookie("accessToken", options)
            .clearcookie("refreshToken", options)
            .json(
                new ApiResponse(200, "", "user logged out")
            )
    }
)

export { registerUser, loginUser,logoutUser }