import api from "@/lib/axios";

export const companyProfileService = {
  async getOrgProfile(slug: string): Promise<any> {
    const res = await api.get(`/organizations/${slug}/profile`);
    return res.data;
  },

  async getOrgAbout(slug: string): Promise<any> {
    const res = await api.get(`/organizations/${slug}/about`);
    return res.data;
  },

  async getOrgTeam(orgId: string): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/team`);
    return res.data;
  },

  async getOrgPeople(orgId: string, params: { page?: number; limit?: number; search?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/people`, { params });
    return res.data;
  },

  async getOrgAlumni(orgId: string, params: { page?: number; limit?: number; search?: string; graduation_year?: number }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/alumni`, { params });
    return res.data;
  },

  async getOrgJobs(orgId: string, params?: { scope?: string; limit?: number; cursor?: string; status?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/jobs`, { params });
    return res.data;
  },

  async updateOrgProfile(orgId: string, data: {
    name?: string;
    headline?: string;
    industry?: string;
    size?: string;
    website?: string;
    country?: string;
    city?: string;
    established_year?: number;
    keyOfferings?: string[];
  }): Promise<any> {
    const res = await api.put(`/organizations/${orgId}/profile`, data);
    return res.data;
  },

  async updateOrgAbout(orgId: string, data: {
    description?: string;
    slogan?: string;
    offices?: Array<{ office_id?: string; city: string; country: string; is_headquarters?: boolean }>;
    links?: Array<{ link_id?: string; platform: string; url: string; display_label?: string }>;
    specialties?: string[];
  }): Promise<any> {
    const res = await api.put(`/organizations/${orgId}/about`, data);
    return res.data;
  },

  async uploadLogo(orgId: string, file: File): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post(`/organizations/${orgId}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async uploadCover(orgId: string, file: File): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append("cover", file);
    const res = await api.post(`/organizations/${orgId}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async deleteLogo(orgId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/logo`);
    return res.data;
  },

  async deleteCover(orgId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/cover`);
    return res.data;
  },

  async getOrgRelationship(orgId: string): Promise<{ isFollowing: boolean; followerCount: number }> {
    const res = await api.get(`/organizations/${orgId}/relationship`);
    return res.data;
  },
  async followOrganization(orgId: string): Promise<any> {
    const res = await api.post(`/organizations/${orgId}/follow`);
    return res.data;
  },

  async unfollowOrganization(orgId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/unfollow`);
    return res.data;
  },

  async subscribeOrganization(orgId: string): Promise<any> {
    const res = await api.post(`/organizations/${orgId}/subscribe`);
    return res.data;
  },

  async unsubscribeOrganization(orgId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/unsubscribe`);
    return res.data;
  },

  async subscribeCommunity(communityId: string): Promise<any> {
    const res = await api.post(`/communities/${communityId}/subscribe`);
    return res.data;
  },

  async unsubscribeCommunity(communityId: string): Promise<any> {
    const res = await api.delete(`/communities/${communityId}/unsubscribe`);
    return res.data;
  },

  async getOrganizationPosts(orgId: string, params: { limit?: number; cursorCreatedAt?: string; cursorPostId?: string; filter?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/posts`, { params });
    return res.data;
  },

  async getOrganizationSubscribers(orgId: string, params?: { search?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/community/subscribers`, { params });
    return res.data?.data || res.data;
  },

  async removeCommunitySubscriber(orgId: string, userId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/community/subscribers/${userId}`);
    return res.data;
  },

  async getOrganizationFollowing(orgId: string, params?: { search?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/following`, { params });
    const rawList = res.data?.data || res.data || [];
    // Normalize both user and company items into a consistent shape
    return rawList.map((item: any) => {
      const isCompany = item.type === 'company' || item.entity_type === 'COMPANY' || item.entity_type === 'INSTITUTION' || !!item.org_id;
      return {
        ...item,
        type: isCompany ? 'company' : 'user',
        id: item.id || item.org_id || item.company_id || item.user_id,
        name: item.name || item.full_name,
        avatarUrl: item.avatarUrl || item.avatar_url || item.logo_url,
        isFollowedBack: item.is_followed_back || false,
      };
    });
  },

  async getOrganizationFollowers(orgId: string, params?: { search?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/followers`, { params });
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    // Normalize both user and company items into a consistent shape
    return rawList.map((item: any) => {
      const isCompany = item.type === 'company' || item.entity_type === 'COMPANY' || item.entity_type === 'INSTITUTION' || !!item.org_id;
      return {
        ...item,
        type: isCompany ? 'company' : 'user',
        id: item.id || item.org_id || item.company_id || item.user_id,
        name: item.name || item.full_name,
        avatarUrl: item.avatarUrl || item.avatar_url || item.logo_url,
        isFollowedBack: item.is_followed_back || false,
      };
    });
  },

  async removeCompanyFollower(orgId: string, followerId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/followers/${followerId}`);
    return res.data;
  },

  async organizationFollowUser(orgId: string, userId: string): Promise<any> {
    const res = await api.post(`/organizations/${orgId}/following/users/${userId}`);
    return res.data;
  },

  async organizationUnfollowUser(orgId: string, userId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/following/users/${userId}`);
    return res.data;
  },

  async organizationFollowOrganization(orgId: string, targetOrgId: string): Promise<any> {
    const res = await api.post(`/organizations/${orgId}/following/organizations/${targetOrgId}`);
    return res.data;
  },

  async organizationUnfollowOrganization(orgId: string, targetOrgId: string): Promise<any> {
    const res = await api.delete(`/organizations/${orgId}/following/organizations/${targetOrgId}`);
    return res.data;
  },

  async blockTarget(targetId: string): Promise<any> {
    const res = await api.post(`/users/${targetId}/block`);
    return res.data;
  },

  async unblockTarget(targetId: string): Promise<any> {
    const res = await api.delete(`/users/${targetId}/unblock`);
    return res.data;
  },
};
