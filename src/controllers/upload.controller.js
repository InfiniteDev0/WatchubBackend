const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/upload/sign?folder=brands&type=image — admin only
async function signUpload(req, res, next) {
  try {
    if (!process.env.CLOUDINARY_API_SECRET) {
      return res
        .status(503)
        .json({
          error: "Cloudinary is not configured. Add CLOUDINARY_* keys to .env",
        });
    }

    const folder = `watchhub/${req.query.folder || "misc"}`;
    const type = req.query.type === "video" ? "video" : "image";
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = { folder, timestamp };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    );

    res.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      resourceType: type,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signUpload };
