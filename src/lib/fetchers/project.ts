// import { CreateProjectDto } from "@/api";
// import { Project } from "@/types/prisma";

// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

// // MARK: 获取项目列表
// export const fetchProjects = async (
//   workspaceId: string,
//   token: string
// ): Promise<Project[]> => {
//   const response = await fetch(
//     `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
//     {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );

//   if (!response.ok) {
//     throw new Error("获取项目列表失败");
//   }

//   return response.json();
// };

// // MARK: 创建项目
// export const createProject = async (
//   workspaceId: string,
//   data: CreateProjectDto,
//   token: string
// ): Promise<Project> => {
//   const response = await fetch(
//     `${API_BASE_URL}/workspaces/${workspaceId}/projects`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     }
//   );

//   if (!response.ok) {
//     throw new Error("创建项目失败");
//   }

//   return response.json();
// };

// // MARK: 更新项目
// export const updateProject = async (
//   projectId: string,
//   data: Partial<CreateProjectDto>,
//   token: string
// ): Promise<Project> => {
//   const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(data),
//   });

//   if (!response.ok) {
//     throw new Error("更新项目失败");
//   }

//   return response.json();
// };

// // MARK: 删除项目
// export const deleteProject = async (
//   projectId: string,
//   token: string
// ): Promise<void> => {
//   const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
//     method: "DELETE",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!response.ok) {
//     throw new Error("删除项目失败");
//   }
// };
