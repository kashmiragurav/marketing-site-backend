/**
 * Shared backend constants — must match frontend src/lib/constants.js exactly.
 * Import in models and controllers to keep category values in sync.
 */

const CATEGORY_ENUM = [
  "Electronics",
  "Clothing",
  "Books",
  "Home",
  "Sports",
  "Beauty",
  "Toys",
  "Food",
];

const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN:       "admin",
  USER:        "user",
};

module.exports = { CATEGORY_ENUM, ROLES };
