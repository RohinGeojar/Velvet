export const setAdmin = (req, res, next) => {
  res.locals.currentUser = req.session.admin || {
    name: "Admin",
    role: "Administrator"
  };
  next();
};

export const isLoggin =  (req,res,next) =>{
    if(!req.session.admin){
      return res.redirect("/adminAuth/login")
    }
    next()
}

export const checkLoggedIn = (req,res,next) =>{
    if(req.session.admin){
      return res.redirect("/adminAuth/dashBoard")
    }
    next()
}
