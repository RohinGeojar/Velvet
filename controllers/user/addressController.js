import * as addressService from "../../services/user/addressService.js";
import User from "../../models/user.js";


export const loadAddAddress = (req, res) => {
  try {


    res.render("user/AddAddress", {
      address:null,
      user: req.user,
      layout: "partials/user/layout",
      showSidebar: true,
      showNavbar: true
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
      showNavbar: true
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
      name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
      isDefault: req.body.isDefault === "on"
    };

    await addressService.addAddress(userId, data);

    res.redirect("/address");

  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to add address");
  }
};



export const loadEditAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const address = await addressService.getAddressById(id, userId);

    res.render("user/addAddress", {
      address,
      user: req.user,
      layout: "partials/user/layout",
      showSidebar: true,
      showNavbar: true
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

    const data = {
      ...req.body,
      name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
      isDefault: req.body.isDefault === "on",
    };

    await addressService.updateAddress(id, userId, data);

    res.redirect("/address");

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
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