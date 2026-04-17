import * as userService from "../../services/admin/userService.js";
import User from "../../models/user.js";


export const loadUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const {
      users,
      totalUsers,
      totalPages,
      currentPage
    } = await userService.getUsersWithPagination(page, limit);

    const admin = await userService.getAdminById(req.session.admin);
    const name = admin.firstName + " " + admin.lastName
    const stats = await userService.getUserStats();



    const usersList = users.map(user => ({
      _id: user._id,
      name: user.firstName,
      email: user.email,
      phone: user.phone || "N/A",
      joinDate: new Date(user.createdAt).toDateString(),
      status: user.isBlocked ? "Blocked" : "Active",
      avatar: user.avatar || ""
    }));


    const pagination = {
      currentPage,
      totalPages,
      totalResults: totalUsers,
      currentRange: `${(page - 1) * limit + 1} - ${Math.min(page * limit, totalUsers)}`
    };

    res.render("admin/users", {
      layout: "partials/admin/adminLayout",
      pageTitle: "User Management",
      pageSubtitle: "Manage, search, and monitor your customer base.",
      activeNavLink: "Users",
      currentUser: admin,
      stats,
      name,
      usersList,
      pagination,
      activeNavLink: "Users"
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading users");
  }
};


export const searchUsers = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const query = search
      ? {
        role: "user",
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } }
        ]
      }
      : { role: "user" };

    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);

    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name || user.firstName || "User",
      email: user.email,
      phone: user.phone || "N/A",
      joinDate: new Date(user.createdAt).toDateString(),
      status: user.isBlocked ? "Blocked" : "Active"
    }));

    res.json({
      users: formattedUsers,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Search failed" });
  }
};

export const blockUser = async (req, res) => {

  await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
  res.json({ success: true });
};

export const unblockUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
  res.json({ success: true });
};

export const refreshStat =  async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const activeUsers = await User.countDocuments({ isBlocked: false });
  const blockedUsers = await User.countDocuments({ isBlocked: true });

  res.json({ totalUsers, activeUsers, blockedUsers });
};