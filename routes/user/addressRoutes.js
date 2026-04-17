import express from "express";
import {
  loadAddressPage,
  addAddress,
  loadEditAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  loadAddAddress
} from "../../controllers/user/addressController.js";

import { userAuth } from "../../middleware/auth.js";
import { addressSchema } from "../../validators/addressvalidator.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();


router.get("/",userAuth, loadAddressPage);
router.post("/",userAuth, addAddress);
router.get("/addAddress", userAuth,validate(addressSchema), loadAddAddress);
router.get("/:id/edit",userAuth, loadEditAddress);
router.post("/:id/edit",userAuth,validate(addressSchema), updateAddress);

router.get("/:id/delete",userAuth,  deleteAddress);
router.get("/:id/default",userAuth,  setDefaultAddress);


export default router;