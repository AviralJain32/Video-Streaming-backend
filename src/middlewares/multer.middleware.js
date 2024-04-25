import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) //ye ek achhi practice ni hai kyuki same naam ki bohot sari files aa sakti hai ek sath but ye operation bohto small interval of time ke liye hai
    }
  })
  
export const upload = multer({ storage: storage })
  