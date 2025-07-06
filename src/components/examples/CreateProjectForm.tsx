// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   VisibilitySelect,
//   VisibilityBadge,
// } from "@/components/ui/VisibilitySelect";
// import { VisibilityType } from "@/lib/types/visibility";
// import { usePermissions } from "@/hooks/usePermissions";

// interface CreateProjectFormProps {
//   onSubmit: (data: ProjectFormData) => void;
//   isLoading?: boolean;
// }

// export interface ProjectFormData {
//   name: string;
//   description: string;
//   visibility: VisibilityType;
// }

// export function CreateProjectForm({
//   onSubmit,
//   isLoading = false,
// }: CreateProjectFormProps) {
//   const [formData, setFormData] = useState<ProjectFormData>({
//     name: "",
//     description: "",
//     visibility: VisibilityType.PRIVATE,
//   });

//   const { isInTeam } = usePermissions();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formData);
//   };

//   const handleInputChange = (field: keyof ProjectFormData, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   return (
//     <Card className="w-full max-w-lg">
//       <CardHeader>
//         <CardTitle>创建新项目</CardTitle>
//         <CardDescription>
//           在{isInTeam ? "团队" : "个人"}空间中创建一个新项目
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="name">项目名称</Label>
//             <Input
//               id="name"
//               value={formData.name}
//               onChange={(e) => handleInputChange("name", e.target.value)}
//               placeholder="输入项目名称"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="description">项目描述</Label>
//             <Input
//               id="description"
//               value={formData.description}
//               onChange={(e) => handleInputChange("description", e.target.value)}
//               placeholder="输入项目描述（可选）"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="visibility">可见性</Label>
//             <VisibilitySelect
//               value={formData.visibility}
//               onValueChange={(value) => handleInputChange("visibility", value)}
//               disabled={isLoading}
//             />
//             <p className="text-sm text-muted-foreground">
//               {isInTeam
//                 ? "选择谁可以查看和编辑此项目"
//                 : "个人空间中的项目只有你可以查看"}
//             </p>
//           </div>

//           <Button type="submit" disabled={isLoading || !formData.name.trim()}>
//             {isLoading ? "创建中..." : "创建项目"}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

// // 项目卡片示例，展示如何使用权限检查
// interface ProjectCardProps {
//   project: {
//     id: string;
//     name: string;
//     description?: string;
//     creatorId: string;
//     visibility: VisibilityType;
//   };
// }

// export function ProjectCard({ project }: ProjectCardProps) {
//   const { checkPermissions } = usePermissions();

//   const canView = checkPermissions.canView(project);
//   const canEdit = checkPermissions.canEdit(project);
//   const canDelete = checkPermissions.canDelete(project);
//   const canChangeVisibility = checkPermissions.canChangeVisibility(project);

//   if (!canView) {
//     return null;
//   }

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-lg">{project.name}</CardTitle>
//           <div className="flex items-center gap-2">
//             <VisibilityBadge value={project.visibility} />
//             {canEdit && (
//               <Button variant="outline" size="sm">
//                 编辑
//               </Button>
//             )}
//             {canDelete && (
//               <Button variant="destructive" size="sm">
//                 删除
//               </Button>
//             )}
//           </div>
//         </div>
//         {project.description && (
//           <CardDescription>{project.description}</CardDescription>
//         )}
//       </CardHeader>
//       <CardContent>
//         <div className="flex items-center gap-2 text-sm text-muted-foreground">
//           <span>权限:</span>
//           <span>
//             {canEdit && "可编辑"}
//             {!canEdit && canView && "仅查看"}
//           </span>
//           {canChangeVisibility && (
//             <span className="text-blue-600">• 可修改可见性</span>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
