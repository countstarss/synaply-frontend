import { Api } from "@/api";

// 创建API客户端实例
export const createApiClient = (token: string) => {
  const api = new Api({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678",
    securityWorker: () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  });

  return api;
};
