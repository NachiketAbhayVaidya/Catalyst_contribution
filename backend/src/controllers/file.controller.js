import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { File } from "../models/file.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file provided");
  }

  const result = await uploadOnCloudinary(req.file.path);
  if (!result) {
    throw new ApiError(502, "File upload failed");
  }

  const file = await File.create({
    owner: req.user._id,
    fileName: req.file.originalname,
    fileUrl: result.secure_url ?? result.url,
    publicId: result.public_id ?? null,
    mimeType: req.file.mimetype,
    size: req.file.size,
    purpose: req.body.purpose ?? null,
  });

  return res.status(201).json({
    success: true,
    data: { id: file._id, fileName: file.fileName, fileUrl: file.fileUrl, mimeType: file.mimeType, size: file.size },
  });
});

export { uploadFile };
