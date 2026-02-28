const { auth } = require("./auth");
const User = require("../models/User");

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }
        next();
    } catch (e) {
        next(e);
    }
};

module.exports = { auth, isAdmin };
