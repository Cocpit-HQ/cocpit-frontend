"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, FileImage } from "lucide-react";
import { Icon } from "@iconify/react";

interface CompanyEditVerificationTabProps {
  onCancel: () => void;
}

interface DocumentItem {
  id: string;
  file: File | null;
  name?: string;
}

export default function CompanyEditVerificationTab({ onCancel }: CompanyEditVerificationTabProps) {
  const [country, setCountry] = useState("India");
  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: "1", file: null, name: "BRN.jpeg" }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Verification details saved successfully!");
    onCancel();
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments(documents.map(doc => doc.id === id ? { ...doc, file } : doc));
    }
  };

  const addDocument = () => {
    setDocuments([...documents, { id: Date.now().toString(), file: null }]);
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const isDirty = country !== "India" || documents.length !== 1 || documents[0]?.file !== null;

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 font-poppins">
      
      {/* Country of Operation */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Country of Operation
        </label>
        <div className="relative w-full h-11">
          <input
            type="text"
            value="India"
            readOnly
            className="w-full h-full px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-gray-50 dark:bg-zinc-900/50 text-[16px] focus:outline-none dark:text-white cursor-not-allowed"
          />
        </div>
      </div>

      {/* DOCUMENTS Header with plus icon */}
      <div className="flex justify-between items-center w-full pt-6">
        <h3 className="text-[14px] font-bold text-[#1A73E8] tracking-wider uppercase">
          DOCUMENTS
        </h3>
        <button
          type="button"
          onClick={addDocument}
          className="w-6 h-6 flex items-center justify-center text-[#1A73E8] hover:scale-110 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Document slots list */}
      <div className="w-full flex flex-col gap-6">
        {documents.map((doc) => {
          const hasFile = doc.file !== null || !!doc.name;
          const displayName = doc.file ? doc.file.name : (doc.name || "");

          return (
            <div key={doc.id} className="flex flex-col gap-2 w-full">
              {/* Label row */}
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-gray-900 dark:text-white">
                  Verification Document
                </span>
                {hasFile && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-zinc-900" />
                )}
              </div>

              {/* Upload field or Document Pill */}
              {hasFile ? (
                <div className="w-full h-12 border border-gray-300 dark:border-zinc-800 rounded-full flex items-center justify-center bg-transparent gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-[14px] font-medium text-gray-900 dark:text-white truncate max-w-[80%]">
                    {displayName}
                  </span>
                </div>
              ) : (
                <div className="w-full">
                  <label
                    htmlFor={`file-input-${doc.id}`}
                    className="w-full h-12 px-6 rounded-full border border-gray-300 dark:border-zinc-800 bg-transparent hover:border-[#1A73E8] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer select-none"
                  >
                    <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-[#6B7280]" />
                  </label>
                  <input
                    type="file"
                    id={`file-input-${doc.id}`}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileChange(doc.id, e)}
                    className="hidden"
                  />
                </div>
              )}

              {/* Delete Trash Icon bottom-right */}
              <div className="flex justify-end w-full">
                <button
                  type="button"
                  onClick={() => removeDocument(doc.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <Icon icon="hugeicons:delete-02" className="w-6 h-6" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end items-center gap-4 w-full mt-6 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-6 border border-gray-500 text-gray-700 dark:text-zinc-300 dark:border-zinc-700 rounded-full font-medium text-[14px] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty}
          className={`h-10 px-8 rounded-full font-semibold text-[14px] transition-colors flex items-center justify-center ${
            isDirty
              ? "bg-[#1A73E8] text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>

    </form>
  );
}
