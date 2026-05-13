import * as addressService from "../../services/user/addressService.js";
import User from "../../models/user.js";
import { addressSchema } from "../../validators/addressValidator.js";
import Address from "../../models/address.js";
import mongoose from "mongoose";


export const loadAddAddress = (req, res) => {
  try {


    res.render("user/AddAddress", {
      address:null,
      user: req.user,
      layout: "partials/user/layout",
      showSidebar: true,
      showNavbar: true,
      
      currentPage:"address"
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading add address page");
  }
}

export const loadAddressPage = async (req, res) => {
  try {
    const userId = req.user._id;
    

    const addresses = await addressService.getUserAddresses(userId);

    res.render("user/address", {
      addresses,
      user: req.user,
      layout: "partials/user/layout",
      showSidebar: true,
      showNavbar: true,
      currentPage:"address"
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load addresses");
  }
};



export const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    const data = {
      ...req.body,
      isDefault: req.body.isDefault === "on"
    };

 
    const validatedData = await addressSchema.validateAsync(data, {
      abortEarly: false
    });

    
    validatedData.name = `${validatedData.firstName} ${validatedData.lastName}`.trim();


    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );
    }

    await addressService.addAddress(userId, validatedData);


    return res.json({ success: true });

  } catch (error) {
    console.log(error);


    if (error.isJoi) {
      return res.status(400).json({
        errors: error.details.map(err => ({
          field: err.path[0],
          message: err.message
        }))
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};



export const loadEditAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;


     if (!id || !mongoose.isValidObjectId(id)) {
  return res.status(400).send("Invalid address ID");
}
    const address = await addressService.getAddressById(id, userId);

    res.render("user/addAddress", {
      address,
      user: req.user,
      layout: "partials/user/layout",
      showSidebar: true,
      showNavbar: true,
      currentPage:"address"
    });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};



export const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const data = { ...req.body };


    const validatedData = await addressSchema.validateAsync(data,{
    abortEarly: false
  });

    
    validatedData.name = `${validatedData.firstName} ${validatedData.lastName}`.trim();


    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );
    }

  
    await addressService.updateAddress(id, userId, validatedData);

    return res.json({ success: true });

  } catch (error) {
    console.log(error);
   if (error.isJoi) {
    const errors = error.details.map(err => ({
      field: err.path[0],
      message: err.message
    }));

    return res.status(400).json({ errors });
  }

  return res.status(500).json({ message: "Server error" });
  }
};



export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    await addressService.deleteAddress(id, userId);

    res.redirect("/address");

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};


//  Set Default Address
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    await addressService.setDefaultAddress(id, userId);

    res.redirect("/address");

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};