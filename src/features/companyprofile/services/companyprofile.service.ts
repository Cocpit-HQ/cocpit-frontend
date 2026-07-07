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

  async getOrganizationPosts(orgId: string, params: { limit?: number; cursorCreatedAt?: string; cursorPostId?: string }): Promise<any> {
    const res = await api.get(`/organizations/${orgId}/posts`, { params });
    return res.data;
  },
};
