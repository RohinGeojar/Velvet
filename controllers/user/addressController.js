import * as addressService from "../../services/user/addressService.js";
import User from "../../models/user.js";
import { addressSchema } from "../../validators/addressValidator.js";
import Address from "../../models/address.js";
import mongoose from "mongoose";
import { capitalizeName, normalizeText } from "../../utils/capitalizer.js";


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

    
    validatedData.name = `${validatedData.firstName} ${validatedData.lastName}`.trim()


    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: userId },
        { isDefault: false }
      );
    }

    await addressService.addAddress(userId, validatedData)


    return res.json({ success: true })

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


    const {error,value} = addressSchema.validate(req.body,{abortEarly:false})
    
            if(error){
                return res.status(400).json({
                    success:false,
                    errors:error.details.map(err =>({
                        field:err.path[0],
                        message:err.message
                    }))
                })
            }
            value.firstName = capitalizeName(value.firstName)
            value.lastName = capitalizeName(value.lastName)
            value.addressLine1 = normalizeText(value.addressLine1)
            const validatedData = {...value,
                
                name : `${value.firstName} ${value.lastName}`.trim()
            }


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

    await addressService.deleteAddress(id, userId)
    console.log(req.query)
    return res.json({
      success: true,
      message: "Address deleted successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message)
  }
}


//  Set Default Address
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    await addressService.setDefaultAddress(id, userId);

    return res.json({
      success: true,
      message: "Default address updated."
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update default address."
    });
  }
}

export const getAddress = async (req,res )=> {
  try {
    const address = await addressService.getAddressById(req.params.id,req.user._id)
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }
    const firstName = address.name.split(" ")[0]
    const lastName = address.name.split(" ")[1]
   
   res.json({
      success: true,
      address: {
        ...address.toObject(),
        firstName,
        lastName
      }

    })
  } catch (error) {
    console.log("get address error", error)
  }
}