"use client";

import React, { useState } from "react";
import { FileText, Search, Folder, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents] = useState([
    {
      id: "1",
      title: "Project Requirements Document",
      type: "document",
      lastModified: "2 hours ago",
      author: "John Doe",
      size: "2.3 MB",
      folder: "Projects",
    },
    {
      id: "2",
      title: "API Documentation",
      type: "document",
      lastModified: "1 day ago",
      author: "Sarah Wilson",
      size: "1.8 MB",
      folder: "Technical",
    },
    {
      id: "3",
      title: "Team Meeting Notes",
      type: "document",
      lastModified: "3 days ago",
      author: "Team Lead",
      size: "856 KB",
      folder: "Meetings",
    },
    {
      id: "4",
      title: "Design Guidelines",
      type: "document",
      lastModified: "1 week ago",
      author: "Design Team",
      size: "4.2 MB",
      folder: "Design",
    },
  ]);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            New Document
          </Button>
          <Button
            variant="outline"
            className="border-app-border text-gray-300 hover:text-white hover:bg-app-content-bg"
          >
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-app-content-bg border-app-border text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* 文档网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 bg-app-content-bg rounded-lg border border-app-border hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* 文档图标和标题 */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{doc.title}</h3>
                <p className="text-sm text-gray-400">{doc.size}</p>
              </div>
            </div>

            {/* 文档信息 */}
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Folder className="w-3 h-3" />
                <span>{doc.folder}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>{doc.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{doc.lastModified}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态提示 */}
      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          {searchQuery ? (
            <>
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400">
                <p className="text-lg font-medium">No documents found</p>
                <p className="mt-2">Try adjusting your search query</p>
              </div>
            </>
          ) : (
            <>
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400">
                <p className="text-lg font-medium">No documents yet</p>
                <p className="mt-2">
                  Create your first document to get started
                </p>
              </div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </>
          )}
        </div>
      )}

      {/* 最近访问 */}
      {!searchQuery && filteredDocs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recently Accessed</h2>
          <div className="space-y-2">
            {documents.slice(0, 3).map((doc) => (
              <div
                key={`recent-${doc.id}`}
                className="flex items-center gap-3 p-3 bg-app-content-bg rounded-lg border border-app-border hover:bg-app-bg transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{doc.title}</h4>
                  <p className="text-xs text-gray-400">
                    Last modified {doc.lastModified} by {doc.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
