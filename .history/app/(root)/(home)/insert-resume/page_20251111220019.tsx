"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Upload, Trash2, Loader2, Link as LinkIcon } from "lucide-react";

// Import Firebase services (Ensure these are correctly exported from your firebase.js)
import { auth, db, storage } from "../../../../firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

type Resume = {
  id: string; // Use string for Firestore document ID
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileUrl: string;
  storagePath: string; // Path in Firebase Storage
};

const RESUMES_COLLECTION = "user_resumes";

const ResumeUploader: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);

  // FIX: Define handleFileChange within the component scope
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- Authentication State Listener ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingResumes(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Fetch Resumes from Firestore ---
  const fetchResumes = useCallback(async (user: User) => {
    if (!db || !user) return;
    setIsLoadingResumes(true);
    setError(null);

    try {
      const q = query(
        collection(db, RESUMES_COLLECTION),
        where("uid", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);

      const fetchedResumes: Resume[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fileName: data.fileName,
          fileSize: data.fileSize,
          uploadDate: new Date(data.uploadDate.seconds * 1000).toLocaleDateString(),
          fileUrl: data.fileUrl,
          storagePath: data.storagePath,
        };
      });
      setResumes(fetchedResumes);
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError("Failed to load resumes.");
    } finally {
      setIsLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && db) {
      fetchResumes(currentUser);
    } else if (!currentUser) {
      setResumes([]);
      setIsLoadingResumes(false);
    }
  }, [currentUser, db, fetchResumes]);

  // --- Upload Logic using Firebase Storage ---
  const handleUpload = async () => {
    if (!selectedFile || !currentUser || !db || !storage) {
      setError("Please log in and select a file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const fileExtension = selectedFile.name.split('.').pop();
    const fileId = `${Date.now()}.${fileExtension}`;
    const storagePath = `resumes/${currentUser.uid}/${fileId}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (err) => {
        console.error("Upload failed:", err);
        setError("Upload failed. Please try again.");
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const newResume: Resume = {
            id: fileId,
            fileName: selectedFile.name,
            fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
            uploadDate: new Date().toLocaleDateString(),
            fileUrl: downloadURL,
            storagePath: storagePath,
          };

          // Save metadata to Firestore
          const docRef = doc(db, RESUMES_COLLECTION, newResume.id);
          await setDoc(docRef, {
            ...newResume,
            uid: currentUser.uid,
            uploadDate: Timestamp.now(),
          });

          await fetchResumes(currentUser);
          setSelectedFile(null);
          setIsUploading(false);
          setActiveResumeId(newResume.id);

        } catch (err) {
          console.error("Post-upload processing failed:", err);
          setError("Upload complete but failed to save file data.");
          setIsUploading(false);
        }
      }
    );
  };

  // --- Delete Logic using Firebase Storage and Firestore ---
  const handleDelete = async (resume: Resume) => {
    if (!currentUser || !db || !storage) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Delete file from Firebase Storage
      const fileRef = ref(storage, resume.storagePath);
      await deleteObject(fileRef);

      // 2. Delete document from Firestore
      const docRef = doc(db, RESUMES_COLLECTION, resume.id);
      await deleteDoc(docRef);

      // 3. Update local state
      setResumes((prev) => prev.filter((r) => r.id !== resume.id));

      // 4. If the active resume was deleted, clear the viewer
      if (activeResumeId === resume.id) {
        setActiveResumeId(null);
      }
    } catch (err) {
      console.error("Deletion failed:", err);
      setError("Failed to delete the resume file.");
    } finally {
      setIsUploading(false);
    }
  };

  const activeResumeFile = resumes.find((r) => r.id === activeResumeId);

  if (!currentUser) {
    return (
      <section className="flex items-center justify-center h-96 text-white bg-[#1C1F2E] rounded-xl shadow-lg p-4">
        <p className="text-xl">Please **Sign In** to upload and manage your resumes. 🔒</p>
      </section>
    );
  }

  return (
    <section className="flex h-[750px] flex-col md:flex-row gap-4 text-white bg-[#1C1F2E] rounded-xl shadow-lg p-4">
      <h1 className="text-3xl font-bold mb-2 md:hidden">Resumes</h1>

      {/* Sidebar: List of Uploaded Resumes */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-[#2C2C3E] rounded-2xl p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Uploaded Resumes</h2>
        {isLoadingResumes ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" /> Fetching resumes...
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {resumes.length === 0 && (
              <span className="text-sm text-gray-400">
                No resumes uploaded yet.
              </span>
            )}

            {resumes.map((resume) => (
              <div
                key={resume.id}
                onClick={() => setActiveResumeId(resume.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${activeResumeId === resume.id
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
                    handleDelete(resume);
                  }}
                  disabled={isUploading}
                  className="p-1 rounded-full text-red-500 hover:bg-red-800 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
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
              disabled={isUploading}
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              {isUploading ? `Uploading ${uploadProgress.toFixed(0)}%...` : "Upload File"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Resume Viewer Area */}
        <div className="flex-1 overflow-y-auto">
          {activeResumeFile ? (
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-2 flex items-center justify-between">
                <span>{activeResumeFile.fileName}</span>
                <a href={activeResumeFile.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View Full <LinkIcon size={14} />
                </a>
              </h3>
              <iframe
                src={activeResumeFile.fileUrl}
                title={activeResumeFile.fileName}
                className="w-full h-full flex-1 rounded-lg border border-gray-700"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a resume from the list or upload a new one.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResumeUploader;