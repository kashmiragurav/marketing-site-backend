/**
 * requireRole / authorizeRoles — role-based access middleware
 *
 * Usage:
 *   requireRole('admin', 'super_admin')
 *   authorizeRoles('admin', 'super_admin')   ← alias, same function
 *
 * Normalises role to lowercase so ADMIN === admin === Admin.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    const userRole = (req.user.role || "").toLowerCase();
    const allowed  = roles.map(r => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Required: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

module.exports = requireRole;
module.exports.authorizeRoles = requireRole; // named alias
