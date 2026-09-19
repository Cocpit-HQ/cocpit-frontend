"use client";

import React, { useState, useEffect } from "react";
import { Plus, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { uploadMedia } from "@/services/api/upload";
import api from "@/lib/axios";
import { companyService } from "@/services/organization.service";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyEditVerificationTabProps {
  onCancel: () => void;
  orgId: string;
}

interface DocumentItem {
  id: string;
  file: File | null;
  name?: string;
  url?: string;
  status?: string; 
  rejectionReason?: string;
  isExisting?: boolean;
  thumbnailUrl?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function CompanyEditVerificationTab({ onCancel, orgId }: CompanyEditVerificationTabProps) {
  const [legalName, setLegalName] = useState("");
  const [incorpDay, setIncorpDay] = useState("");
  const [incorpMonth, setIncorpMonth] = useState("");
  const [incorpYear, setIncorpYear] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [status, setStatus] = useState<string>("UNVERIFIED");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { activeProfile, refreshProfile, refreshCompanies } = useActiveProfile();
  const isVerified = activeProfile?.verification_status === "VERIFIED" || activeProfile?.verification_status === "DOMAIN_VERIFIED";

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await api.get(`/organizations/${orgId}`);
        const orgData = res.data.organization || res.data;
        setStatus(orgData.verification_status || "UNVERIFIED");
        if (orgData.legal_name) setLegalName(orgData.legal_name);
        if (orgData.incorporation_date) {
          const dateParts = new Date(orgData.incorporation_date);
          if (!isNaN(dateParts.getTime())) {
            setIncorpDay(String(dateParts.getDate()).padStart(2, '0'));
            setIncorpMonth(MONTHS[dateParts.getMonth()]);
            setIncorpYear(String(dateParts.getFullYear()));
          }
        }
        
        const verRes = await api.get(`/organizations/${orgId}/verifications`).catch(() => ({ data: { verifications: [] } }));
        const verifications = verRes.data.verifications || [];
        const latestDocVer = verifications.find((v: any) => v.verification_type === "DOCUMENT");
        
        if (latestDocVer && latestDocVer.document_urls) {
          let urls: string[] = [];
          try {
            urls = typeof latestDocVer.document_urls === 'string' 
              ? JSON.parse(latestDocVer.document_urls) 
              : latestDocVer.document_urls;
          } catch (e) {
            urls = [];
          }
          
          if (latestDocVer.review_notes) {
            setReviewNotes(latestDocVer.review_notes);
          }

          if (Array.isArray(urls)) {
            const loadedDocs: DocumentItem[] = urls.map((url, idx) => ({
              id: `existing-${idx}`,
              file: null,
              name: url.split("/").pop() || `Document ${idx + 1}`,
              url,
              status: latestDocVer.is_verified ? "Verified" : (latestDocVer.review_notes ? "Rejected" : "Pending verification"),
              rejectionReason: latestDocVer.review_notes || undefined,
              isExisting: true,
              thumbnailUrl: url
            }));
            setDocuments(loadedDocs);
          }
        }
      } catch (err) {
        console.error("Error fetching org verification details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [orgId]);

  const addDocument = () => {
    const newDoc: DocumentItem = {
      id: Date.now().toString(),
      file: null,
      status: "Pending verification"
    };
    setDocuments([...documents, newDoc]);
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const thumbnailUrl = URL.createObjectURL(file);
      setDocuments(documents.map(doc => doc.id === id ? { 
        ...doc, 
        file, 
        name: file.name,
        thumbnailUrl,
        status: 'Pending verification' 
      } : doc));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim()) {
      toast.error("Please enter the company's full legal name");
      return;
    }
    if (!incorpDay || !incorpMonth || !incorpYear) {
      toast.error("Please select complete date of incorporation");
      return;
    }
    
    setSubmitting(true);
    try {
        const filesToUpload = documents.map(doc => doc.file).filter(file => file !== null) as File[];
        let urls: string[] = [];
        
        if (filesToUpload.length > 0) {
            urls = await uploadMedia(filesToUpload);
        }
        
        const existingUrls = documents.filter(doc => doc.isExisting && doc.url).map(doc => doc.url!);
        const finalUrls = [...existingUrls, ...urls];

        if (finalUrls.length === 0) {
            toast.error("No documents to submit.");
            setSubmitting(false);
            return;
        }

        await api.post(`/organizations/${orgId}/verify/document`, {
            legalName,
            incorporationDay: incorpDay,
            incorporationMonth: incorpMonth,
            incorporationYear: incorpYear,
            documentUrls: finalUrls
        });

        toast.success("Verification details submitted successfully!");
        if (refreshProfile) await refreshProfile();
        if (refreshCompanies) await refreshCompanies();
        onCancel();
    } catch (err) {
        console.error("Error submitting documents:", err);
        toast.error("Failed to submit verification details.");
    } finally {
        setSubmitting(false);
    }
  };

  const isDirty = legalName.trim() !== "" || incorpDay !== "" || incorpMonth !== "" || incorpYear !== "" || documents.some(doc => doc.file !== null);

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  if (isVerified) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organization Verified</h2>
        <p className="text-sm text-gray-500 max-w-md">Your organization has been successfully verified. No further action is required.</p>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col font-poppins">
      
      <div className="flex flex-col gap-6">
          {/* Legal Name */}
          <div className="flex flex-col gap-2 w-full mt-4">
            <label className="text-[14px] font-medium text-[#000000] dark:text-white">
              Company Full Legal Name *
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Acme Corporation Pvt Ltd"
              className="w-full h-11 px-4 border border-gray-200 dark:border-zinc-800 rounded-full bg-white dark:bg-zinc-900/50 text-[14px] focus:outline-none dark:text-white"
            />
          </div>

          {/* Incorporation Date */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-[#000000] dark:text-white">
              Date of Incorporation *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Select value={incorpDay} onValueChange={setIncorpDay}>
                <SelectTrigger className="rounded-full border border-gray-200 dark:border-zinc-800 h-11">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={incorpMonth} onValueChange={setIncorpMonth}>
                <SelectTrigger className="rounded-full border border-gray-200 dark:border-zinc-800 h-11">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={incorpYear} onValueChange={setIncorpYear}>
                <SelectTrigger className="rounded-full border border-gray-200 dark:border-zinc-800 h-11">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DOCUMENTS Header */}
          <div className="flex justify-between items-center w-full pt-4">
            <h3 className="text-[14px] font-bold text-[#1A73E8] tracking-wider uppercase">
              VERIFICATION DOCUMENTS
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
          <div className="w-full flex flex-col gap-4">
            {documents.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 dark:border-zinc-800 rounded-[20px]">
                    No documents added. Click the + button to add a verification document.
                </div>
            )}
            
            {documents.map((doc) => {
              const hasFile = doc.file !== null || doc.isExisting;
              const displayName = doc.name || "";

              return (
                <div key={doc.id} className="flex flex-col w-full">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                      Verification Document
                    </span>
                    {doc.status === 'Verified' && (
                      <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 fill-emerald-50 dark:fill-zinc-900" />
                    )}
                  </div>

                  {hasFile ? (
                    <div className="flex flex-col w-full">
                        <div className="w-full h-[64px] border border-gray-200 dark:border-zinc-800 rounded-[32px] flex items-center justify-between px-2 bg-white dark:bg-zinc-900/50">
                          
                          <div className="flex items-center gap-3 overflow-hidden pl-1">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-gray-100">
                                {doc.thumbnailUrl ? (
                                    <img src={doc.thumbnailUrl} alt="doc" className="w-full h-full object-cover" />
                                ) : (
                                    <Icon icon="lucide:file-text" className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <span className="text-[14px] font-semibold text-gray-800 dark:text-white truncate max-w-[150px] md:max-w-[200px]">
                                {displayName}
                            </span>
                          </div>
                          
                          <div className="text-[13px] font-medium pr-4 whitespace-nowrap flex-shrink-0">
                            {doc.status === 'Verified' && <span className="text-emerald-500">Verified</span>}
                            {doc.status === 'Pending verification' && <span className="text-gray-400">Pending verification</span>}
                            {doc.status === 'Rejected' && <span className="text-red-400">Rejected({doc.rejectionReason || 'Fraud suspect'})</span>}
                          </div>
                          
                        </div>
                        
                        <div className="flex justify-end mt-1.5 pr-2">
                            <button
                                type="button"
                                onClick={() => removeDocument(doc.id)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Remove document"
                            >
                                <Trash2 className="w-[18px] h-[18px] stroke-[2px]" />
                            </button>
                        </div>
                    </div>
                  ) : (
                    <div className="w-full relative mb-8">
                      <label
                        htmlFor={`file-input-${doc.id}`}
                        className="w-full h-[64px] px-6 rounded-[32px] border border-dashed border-gray-300 dark:border-zinc-800 bg-gray-50/50 hover:border-[#1A73E8] hover:bg-blue-50/30 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer select-none"
                      >
                        <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-[#6B7280]" />
                        <span className="ml-2 text-sm text-gray-500 font-medium">Click to upload document</span>
                      </label>
                      <input
                        type="file"
                        id={`file-input-${doc.id}`}
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(doc.id, e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="absolute right-2 -bottom-8 p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove document slot"
                      >
                         <Trash2 className="w-[18px] h-[18px] stroke-[2px]" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end items-center gap-4 w-full mt-8 mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-8 border border-gray-400 text-gray-700 dark:text-zinc-300 dark:border-zinc-700 rounded-full font-medium text-[14px] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || submitting}
          className={`h-10 px-10 rounded-full font-medium text-[14px] transition-colors flex items-center justify-center ${
            isDirty && !submitting
              ? "bg-[#1A73E8] text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

    </form>
  );
}
