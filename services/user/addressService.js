import Address from "../../models/address.js";


export const addAddress = async (userId, data) => {
  const address = new Address({
    user: userId,
    ...data,
  });

  return await address.save();
};


export const getUserAddresses = async (userId) => {
  return await Address.find({ user: userId })
    .sort({ isDefault: -1, createdAt: -1 });
};


export const getAddressById = async (addressId, userId) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  });

  if (!address) {
    throw new Error("Address not found ");
  }

  return address;
};


export const updateAddress = async (addressId, userId, data) => {
  
  const address = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    data,
    { returnDocument: 'after' }
  );
console.log("(address updated" ,address)
  if (!address) {
    throw new Error("Address not found");
  }

  return address;
};


export const deleteAddress = async (addressId, userId) => {
  const address = await Address.findOneAndDelete({
    _id: addressId,
    user: userId,
  });

  if (!address) {
    throw new Error("Address not found");
  }

  return address;
};


export const setDefaultAddress = async (addressId, userId) => {
     await Address.updateMany(
    { user: userId },
    { $set: { isDefault: false } }
  );
  const address = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { isDefault: true },
    { returnDocument: 'after' }
  );

  if (!address) {
    throw new Error("Address not found");
  }

  return address;
};