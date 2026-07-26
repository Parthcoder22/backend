import { asyncHandler } from "../utils/ayncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/User.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(

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
    async (req, res) => {
        const { username, email, password, fullName } = req.body
        console.log(username, email, password, fullName);
        if (
            [username, fullName, email, password].some(field => field?.trim === "")
        ) {
            throw new ApiError(400, "All field are required.");
        }

        const existedUser = User.findOne(
            $or[{ email }, { username }]
        )

        if (existedUser) {
            throw new ApiError(409, "user with username or email already exist.")
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required.")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required.")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password - refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "Somthing went weong while regestering user.")
        }

        return new ApiResponse(200, createdUser)

    }

)

export { registerUser }