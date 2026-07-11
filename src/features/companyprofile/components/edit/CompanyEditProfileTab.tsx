"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Icon } from "@iconify/react";
import { v4 as uuidv4 } from "uuid";
import { getPlacesAutocomplete, getPlaceDetails } from "@/features/company-onboarding/services/company-onboarding.api";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import { useToast } from "@/hooks/use-toast";
import { useCompanyEditStore } from "../../store/useCompanyEditStore";

interface CompanyEditProfileTabProps {
  onCancel: () => void;
  orgId: string;
}

interface KeyOffering {
  id: string;
  text: string;
}

const DEFAULT_OFFERINGS = [
  "May offer exposure to emerging technologies",
  "Operates across multiple markets",
  "Focuses on innovation and growth",
  "Diverse project opportunities",
];

export default function CompanyEditProfileTab({ onCancel, orgId }: CompanyEditProfileTabProps) {
  const { slug } = useParams() as { slug: string };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["orgProfile", slug],
    queryFn: () => companyProfileService.getOrgProfile(slug),
  });

  const { profileDraft, setProfileDraft, clearProfileDraft } = useCompanyEditStore();
  const formData = profileDraft;
  const keyOfferings = profileDraft.keyOfferings;

  const [initialData, setInitialData] = useState({
    name: "",
    industry: "Technology",
    foundedYear: "",
    size: "1 - 10 Members",
    website: "",
    country: "India",
    city: "Mumbai",
    headline: "",
  });

  const [initialOfferings, setInitialOfferings] = useState<KeyOffering[]>([]);

  const sessionToken = useRef(uuidv4());
  const [citySearchQuery, setCitySearchQuery] = useState<string | null>(null);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isCityDropdownOpen) return;
    const query = citySearchQuery || "";
    
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearchingCity(true);
        try {
          const res = await getPlacesAutocomplete(query, sessionToken.current, formData.country);
          if (res.success && res.data) {
            setCitySuggestions(res.data);
          }
        } catch (e) {
          console.error("Failed to fetch cities", e);
        } finally {
          setIsSearchingCity(false);
        }
      } else {
        setCitySuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [citySearchQuery, isCityDropdownOpen, formData.country]);

  const handleCitySelect = async (placeId: string, displayName: string) => {
    setIsCityDropdownOpen(false);
    setCitySearchQuery(null);
    
    setProfileDraft({ city: displayName });
    
    try {
      const res = await getPlaceDetails(placeId, sessionToken.current);
      if (res.success && res.data) {
        setProfileDraft({
          city: res.data.city || displayName,
          ...(res.data.country && { country: res.data.country }),
        });
      }
    } catch (e) {
      console.error("Failed to get place details", e);
    }
  };

  useEffect(() => {
    if (profileData) {
      const org = profileData.org || profileData;
      const newForm = {
        name: org.name || "",
        industry: org.industry || "Technology",
        foundedYear: org.established_year?.toString() || org.founded?.toString() || "",
        size: org.size || org.employeeCount || "1 - 10 Members",
        website: org.website || org.websiteUrl || "",
        country: org.country || "India",
        city: org.city || (org.location ? org.location.split(',')[0] : "Mumbai"),
        headline: org.headline || org.tagline || "",
      };
      setInitialData(newForm);

      const existingOfferings: string[] = org.key_offerings || org.keyOfferings || [];
      const offeringsSource: string[] = existingOfferings.length ? existingOfferings : DEFAULT_OFFERINGS;
      const newOfferings = offeringsSource.map((text: string, idx: number) => ({ id: String(idx), text }));
      setInitialOfferings(newOfferings);

      if (!profileDraft.isInitialized) {
        setProfileDraft({
          ...newForm,
          keyOfferings: newOfferings,
          isInitialized: true,
        });
      }
    }
  }, [profileData, profileDraft.isInitialized, setProfileDraft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileDraft({ [name]: value });
  };

  const handleAddOffering = () => {
    setProfileDraft({ keyOfferings: [...keyOfferings, { id: Date.now().toString(), text: "" }] });
  };

  const handleOfferingChange = (id: string, value: string) => {
    setProfileDraft({
      keyOfferings: keyOfferings.map((o) => (o.id === id ? { ...o, text: value } : o))
    });
  };

  const isDirty =
    profileDraft.name !== initialData.name ||
    profileDraft.industry !== initialData.industry ||
    profileDraft.foundedYear !== initialData.foundedYear ||
    profileDraft.size !== initialData.size ||
    profileDraft.website !== initialData.website ||
    profileDraft.country !== initialData.country ||
    profileDraft.city !== initialData.city ||
    profileDraft.headline !== initialData.headline ||
    JSON.stringify(keyOfferings) !== JSON.stringify(initialOfferings);

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyProfileService.updateOrgProfile(orgId, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile changes saved successfully!",
      });
      clearProfileDraft();
      queryClient.invalidateQueries({ queryKey: ["orgProfile", slug] });
      queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
      onCancel();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || updateMutation.isPending) return;
    
    updateMutation.mutate({
      name: formData.name,
      headline: formData.headline,
      industry: formData.industry,
      size: formData.size,
      website: formData.website,
      country: formData.country,
      city: formData.city,
      established_year: parseInt(formData.foundedYear) || undefined,
      keyOfferings: keyOfferings.map((o) => o.text).filter(Boolean),
    });
  };

  if (isLoading) {
    return <div className="py-10 text-center text-zinc-500">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      
      {/* 2-Column Row 1: Name and Industry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            Organization Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
          />
        </div>

        {/* Industry */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            Industry Selection
          </label>
          <div className="relative w-full h-11">
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full h-full px-4 pr-10 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] appearance-none focus:outline-none dark:text-white focus:border-[#1A73E8]"
            >
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2-Column Row 2: Founded Year and Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Founded Year */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            Founded Year
          </label>
          <input
            type="text"
            name="foundedYear"
            value={formData.foundedYear}
            onChange={handleChange}
            className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
          />
        </div>

        {/* Organization Size */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            Organization Size
          </label>
          <div className="relative w-full h-11">
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="w-full h-full px-4 pr-10 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] appearance-none focus:outline-none dark:text-white focus:border-[#1A73E8]"
            >
              <option value="1 - 10 Members">1 - 10 Members</option>
              <option value="11 - 50 Members">11 - 50 Members</option>
              <option value="51 - 200 Members">51 - 200 Members</option>
              <option value="201 - 500 Members">201 - 500 Members</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 1-Column Row 3: Website */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Website
        </label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
        />
      </div>

      {/* Headquarter Section Header */}
      <div className="w-full mt-2">
        <h3 className="text-[14px] font-bold text-[#1A73E8] tracking-wider uppercase font-poppins">
          HEADQUARTER LOCATION *
        </h3>
      </div>

      {/* 2-Column Row 4: Country and City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Country */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            Country
          </label>
          <div className="relative w-full h-11">
            <input
              type="text"
              name="country"
              value="India"
              readOnly
              className="w-full h-full px-4 border border-gray-300 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50 text-[16px] focus:outline-none dark:text-white cursor-not-allowed"
            />
          </div>
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            City
          </label>
          <div className="relative w-full h-11" ref={cityRef}>
            <input
              type="text"
              autoComplete="new-password"
              value={isCityDropdownOpen ? (citySearchQuery ?? formData.city) : formData.city}
              onChange={(e) => {
                setCitySearchQuery(e.target.value);
                setProfileDraft({ city: e.target.value });
              }}
              onFocus={() => {
                setIsCityDropdownOpen(true);
                if (citySearchQuery === null && formData.city) {
                  setCitySearchQuery(formData.city);
                }
              }}
              placeholder="Search city"
              className="w-full h-full px-4 pr-10 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] focus:outline-none dark:text-white focus:border-[#1A73E8] placeholder-gray-400"
            />
            <Icon icon="mynaui:search" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            
            {isCityDropdownOpen && ((citySearchQuery || "").length > 1 || isSearchingCity) && (
              <div className="absolute top-[50px] left-0 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-lg rounded-2xl py-2 z-50 max-h-[200px] overflow-y-auto no-scrollbar">
                {isSearchingCity ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                    <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                ) : citySuggestions.length > 0 ? (
                  citySuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      onMouseDown={() => handleCitySelect(suggestion.placeId, suggestion.displayName)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
                    >
                      <div className="font-medium text-[14px] text-gray-900 dark:text-white">
                        {suggestion.displayName}
                      </div>
                      <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {suggestion.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No cities found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1-Column Row 5: Headline */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Headline *
        </label>
        <input
          type="text"
          name="headline"
          value={formData.headline}
          onChange={handleChange}
          required
          className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
        />
      </div>

      {/* Key Offerings Section */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center w-full">
          <label className="text-[14px] font-medium text-[#000000] dark:text-white">
            Key offerings
          </label>
          <button
            type="button"
            onClick={handleAddOffering}
            className="w-6 h-6 flex items-center justify-center text-[#1A73E8] hover:scale-110 transition-transform cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 w-full">
          {keyOfferings.map((offering) => (
            <input
              key={offering.id}
              type="text"
              value={offering.text}
              onChange={(e) => handleOfferingChange(offering.id, e.target.value)}
              placeholder="Add a key offering"
              className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
            />
          ))}
        </div>
      </div>

      {/* Form Action Buttons at Footer */}
      <div className="flex justify-end items-center gap-4 w-full mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-6 border border-gray-500 text-gray-700 dark:text-zinc-300 dark:border-zinc-700 rounded-full font-medium text-[14px] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className={`h-10 px-8 rounded-full font-semibold text-[14px] transition-colors flex items-center justify-center ${
            isDirty && !updateMutation.isPending
              ? "bg-[#1A73E8] text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
          }`}
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

    </form>
  );
}
