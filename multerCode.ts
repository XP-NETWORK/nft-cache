//I DID NOT INSTALL MULTER, I PROBABLY NEED TO 

/*const upload = multer({
    fileFilter,
    storage: multerS3({
      
      metadata: function (req, file, cb) {
        let securityError =  null;
        if(!req.userAdmin.isAdmin) {
          securityError = new Error("Not admin");
        }
        cb(securityError, { fieldName: "images" });
      },
      key: function (req, file, cb) {
        const artName = file.originalname.toLocaleLowerCase().split(" ").join("-");
        cb(null, artName + "-" + Date.now());
      },
    }),
  });*/