import express from "express";
import {
  loadAddressPage,
  addAddress,
  loadEditAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  loadAddAddress,
  getAddress
} from "../../controllers/user/addressController.js";

import { userAuth } from "../../middleware/auth.js";
import { addressSchema } from "../../validators/addressvalidator.js";
import { validate } from "../../middleware/validate.js";
import { addcheckoutAddress } from "../../controllers/user/shopController.js";
import { navbarCounts } from "../../middleware/navbarCounts.js";

const router = express.Router();
router.use(navbarCounts)

router.get("/",userAuth, loadAddressPage);
router.post("/",userAuth, addAddress);
router.get("/addAddress", userAuth,validate(addressSchema), loadAddAddress);
router.get("/:id/edit",userAuth, loadEditAddress);
router.post("/:id/edit",userAuth, updateAddress);

router.delete("/:id/delete",userAuth,  deleteAddress);
router.post("/:id/default",userAuth,  setDefaultAddress);


// ================CHECKOUT ============================
router.get("/:id", userAuth, getAddress);

router.post("/checkout",userAuth,addcheckoutAddress)



export default router;