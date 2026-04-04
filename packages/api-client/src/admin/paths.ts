export const adminApiPaths = {
  auth: {
    token: "/api/v1/admin/auth/token",
    refreshToken: "/api/v1/admin/auth/refresh-token"
  },
  accounts: {
    forgotPassword: "/api/v1/accounts-admin/forgot-password",
    changePassword: "/api/v1/accounts-admin/change-password",
    resetPassword: "/api/v1/accounts-admin/reset-password",
    verifyEmail: "/api/v1/accounts-admin/verify-email"
  },
  episodes: {
    list: "/api/v1/admin/episodes",
    byId: "/api/v1/admin/episodes/{id}"
  },
  banners: {
    list: "/api/v1/admin/banners",
    byId: "/api/v1/admin/banners/{id}"
  },
  categories: {
    list: "/api/v1/admin/categories",
    byId: "/api/v1/admin/categories/{id}"
  },
  teamMembers: {
    list: "/api/v1/admin/team-members",
    byId: "/api/v1/admin/team-members/{id}"
  },
  images: {
    upload: "/api/v1/admin/images/upload",
    remove: "/api/v1/admin/images/delete"
  }
} as const;
