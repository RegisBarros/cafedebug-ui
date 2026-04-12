import type { TeamMemberRequest, GetApiV1AdminTeamMembersParams } from "../../generated/models";
import {
  getApiV1AdminTeamMembers,
  getApiV1AdminTeamMembersId,
  postApiV1AdminTeamMembers,
  putApiV1AdminTeamMembersId,
  deleteApiV1AdminTeamMembersId
} from "../../generated/admin-team-members/admin-team-members";

export const createTeamMembersResource = () => ({
  list: (params?: GetApiV1AdminTeamMembersParams, options?: RequestInit) =>
    getApiV1AdminTeamMembers(params, options),

  get: (id: number, options?: RequestInit) =>
    getApiV1AdminTeamMembersId(id, options),

  create: (body: TeamMemberRequest, options?: RequestInit) =>
    postApiV1AdminTeamMembers(body, options),

  update: (id: number, body: TeamMemberRequest, options?: RequestInit) =>
    putApiV1AdminTeamMembersId(id, body, options),

  remove: (id: number, options?: RequestInit) =>
    deleteApiV1AdminTeamMembersId(id, options)
});
