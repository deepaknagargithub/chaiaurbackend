import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    return cb(null, file.originalname) // we can further add random name 
  }
})

export const upload = multer({ storage: storage })