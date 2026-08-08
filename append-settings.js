const fs = require('fs');
const content = `

// --- Identity Verification ---

export const verifyIdentity = async (
  formData: FormData,
  companyId?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/settings/account/verify-identity", formData, {
    headers: {
      ...getActorHeaders(companyId),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
`;
fs.appendFileSync('src/services/api/settings.ts', content);
