import User from "../../models/user.js";


export const getUsersWithPagination = async (page, limit,  ) => {

 

  const skip = (page - 1) * limit;

  const users = await User.find({role:"user"})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments({role:"user"});

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page
  };
};


export const getUserStats = async () => {

  const totalUsers = await User.countDocuments({ role: "user" });

  const activeUsers = await User.countDocuments({
    role: "user",
    isBlocked: false
  });

  const blockedUsers = await User.countDocuments({
    role: "user",
    isBlocked: true
  });

  return {
    totalUsers,
    activeUsers,
    blockedUsers
  };
};

export const getAdminById = async (id) => {
  return await User.findById(id);
};


export const blockUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { isBlocked: true },
    { returnDocument: "after" }
  );
};


export const unblockUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { isBlocked: false },
    { returnDocument: "after" }
  );
};