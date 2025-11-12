"use client";
import React, { useState } from "react";
import { FileText, Upload, Trash2 } from "lucide-react";

type Resume = {
  id: number;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileUrl: string;
};

const ResumeUploader: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);

    setTimeout(() => {
      const newResume: Resume = {
        id: Date.now(),
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toLocaleDateString(),
        fileUrl: URL.createObjectURL(selectedFile),
      };

      setResumes((prev) => [newResume, ...prev]);
      setSelectedFile(null);
      setIsUploading(false);
      setActiveResume(newResume.id);
    }, 1000);
  };

  const handleDelete = (id: number, fileUrl: string) => {
    // 1. Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(fileUrl);

    // 2. Filter out the deleted resume from state
    setResumes((prev) => prev.filter((r) => r.id !== id));

    // 3. If the active resume was deleted, clear the viewer
    if (activeResume === id) {
      setActiveResume(null);
    }
  };

  const activeResumeFile = resumes.find((r) => r.id === activeResume);

  return (
    <section className="flex h-[750px] flex-col md:flex-row gap-4 text-white bg-[#1C1F2E] rounded-xl shadow-lg p-4">
      <h1 className="text-3xl font-bold mb-2 md:hidden">Resumes</h1>

      {/* Sidebar: List of Uploaded Resumes */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-[#2C2C3E] rounded-2xl p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Uploaded Resumes</h2>

        <div className="flex flex-col gap-3 overflow-y-auto">
          {resumes.length === 0 && (
            <span className="text-sm text-gray-400">
              No resumes uploaded yet.
            </span>
          )}

          {resumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => setActiveResume(resume.id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                activeResume === resume.id
                  ? "bg-purple-1"
                  : "hover:bg-[#3C3C4E]"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={32} />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium truncate">
                    {resume.fileName}
                  </span>
                  <span className="text-xs text-gray-300 truncate">
                    {resume.fileSize} - {resume.uploadDate}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(resume.id, resume.fileUrl);
                }}
                className="p-1 rounded-full text-red-500 hover:bg-red-800 hover:text-white transition-colors flex-shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1 bg-[#2C2C3E] rounded-2xl p-4">
        <div className="pb-4 border-b border-gray-700 mb-4">
          <h2 className="font-semibold text-lg mb-3">Upload New Resume</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept="application/pdf,.doc,.docx"
              onChange={handleFileChange}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 bg-[#1E1E2F] text-white file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>

        {/* Resume Viewer Area */}
        <div className="flex-1 overflow-y-auto">
          {activeResumeFile ? (
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-2">
                {activeResumeFile.fileName}
              </h3>
              <iframe
                src={activeResumeFile.fileUrl}
                title={activeResumeFile.fileName}
                className="w-full h-full flex-1 rounded-lg border border-gray-700"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a resume from the list to view it here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResumeUploader;
