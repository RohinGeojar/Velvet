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
      name: user.firstName + " " + user.lastName,
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
    const filter = req.query.filter || "latest";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;


    let query = { role: "user" };


    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }


    if (filter === "blocked") {
      query.isBlocked = true;
    }



    let sortOption = { createdAt: -1 };
    if (filter === "oldest") {
      sortOption = { createdAt: 1 };
    }
    if (filter === "asc") sortOption = { firstName: 1 };
    if (filter === "desc") sortOption = { firstName: -1 };


    const users = await User.find(query)
      .collation({ locale: "en", strength: 2 })
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    const start = totalUsers === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalUsers);

    res.json({
      users: users.map(user => ({
        _id: user._id,
        name: user.firstName,
        email: user.email,
        phone: user.phone || "N/A",
        joinDate: new Date(user.createdAt).toDateString(),
        status: user.isBlocked ? "Blocked" : "Active"
      })),
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      currentRange: `${start} - ${end}`
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

export const refreshStat = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const activeUsers = await User.countDocuments({ role: "user", isBlocked: false });
  const blockedUsers = await User.countDocuments({ role: "user", isBlocked: true });

  res.json({ totalUsers, activeUsers, blockedUsers });
};