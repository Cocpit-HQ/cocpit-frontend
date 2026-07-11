"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronDown, Plus, MapPin } from "lucide-react";
import { Icon } from "@iconify/react";
import { v4 as uuidv4 } from "uuid";
import { getPlacesAutocomplete, getPlaceDetails } from "@/features/company-onboarding/services/company-onboarding.api";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import { useToast } from "@/hooks/use-toast";
import { useCompanyEditStore, Office, CustomLink } from "../../store/useCompanyEditStore";

const MEDIA_OPTIONS = [
  { value: "instagram", label: "Instagram", icon: "ri:instagram-line" },
  { value: "twitter", label: "Twitter", icon: "codicon:twitter" },
  { value: "youtube", label: "You tube", icon: "iconoir:youtube" },
  { value: "discord", label: "Discord", icon: "iconoir:discord" },
  { value: "facebook", label: "Facebook", icon: "circum:facebook" },
];

interface CompanyEditAboutTabProps {
  onCancel: () => void;
  orgId: string;
}

export default function CompanyEditAboutTab({ onCancel, orgId }: CompanyEditAboutTabProps) {
  const { slug } = useParams() as { slug: string };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aboutData, isLoading } = useQuery({
    queryKey: ["orgAbout", slug],
    queryFn: () => companyProfileService.getOrgAbout(slug),
  });

  const { aboutDraft, setAboutDraft, clearAboutDraft } = useCompanyEditStore();
  const description = aboutDraft.description;
  const slogan = aboutDraft.slogan;
  const offices = aboutDraft.offices;
  const links = aboutDraft.links;
  const specialties = aboutDraft.specialties;

  const [initialDataStr, setInitialDataStr] = useState("");

  const sessionToken = useRef(uuidv4());
  const [activeCitySearchOfficeId, setActiveCitySearchOfficeId] = useState<string | null>(null);
  const [citySearchQueries, setCitySearchQueries] = useState<Record<string, string>>({});
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const cityRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [activeMediaDropdownId, setActiveMediaDropdownId] = useState<string | null>(null);
  const mediaDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeCitySearchOfficeId && cityRefs.current[activeCitySearchOfficeId]) {
        if (!cityRefs.current[activeCitySearchOfficeId]!.contains(event.target as Node)) {
          setActiveCitySearchOfficeId(null);
        }
      }
      if (activeMediaDropdownId && mediaDropdownRefs.current[activeMediaDropdownId]) {
        if (!mediaDropdownRefs.current[activeMediaDropdownId]!.contains(event.target as Node)) {
          setActiveMediaDropdownId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeCitySearchOfficeId, activeMediaDropdownId]);

  useEffect(() => {
    if (!activeCitySearchOfficeId) return;
    const query = citySearchQueries[activeCitySearchOfficeId] || "";
    
    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearchingCity(true);
        try {
          const office = offices.find(o => o.id === activeCitySearchOfficeId);
          const res = await getPlacesAutocomplete(query, sessionToken.current, office?.country || "");
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
  }, [activeCitySearchOfficeId, citySearchQueries, offices]);

  const handleCitySelect = async (officeId: string, placeId: string, displayName: string) => {
    setActiveCitySearchOfficeId(null);
    setCitySearchQueries(prev => ({ ...prev, [officeId]: "" }));
    
    // Immediately update the UI to make it feel responsive and ensure it "takes"
    // Even if the backend fails to resolve a specific 'city' field for this placeId
    handleOfficeChange(officeId, "city", displayName);
    
    try {
      const res = await getPlaceDetails(placeId, sessionToken.current);
      if (res.success && res.data) {
        // If the backend found a more accurate city name, use it, otherwise keep the display name
        if (res.data.city) {
          handleOfficeChange(officeId, "city", res.data.city);
        }
        if (res.data.country) {
          handleOfficeChange(officeId, "country", res.data.country);
        }
      }
    } catch (e) {
      console.error("Failed to get place details", e);
    }
  };

  useEffect(() => {
    if (aboutData) {
      // Backend returns { about: {...}, offices: [...], links: [...], specialties: [{specialty_id, name}] }
      const about = aboutData.about || aboutData;
      const officesArr = aboutData.offices || [];
      const linksArr = aboutData.links || [];
      const specialtiesArr = aboutData.specialties || [];
      
      const parsedOffices = officesArr.map((o: any, idx: number) => ({
        id: o.office_id || o.id || String(idx),
        country: o.country || "India",
        city: o.city || "Mumbai",
        address: o.address || "",
        mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=200&fit=crop",
      }));
      
      const parsedLinks = linksArr.map((l: any, idx: number) => ({
        id: l.link_id || l.id || String(idx),
        label: l.display_label || l.platform || l.label || "",
        platform: l.platform || MEDIA_OPTIONS[0].value,
        url: l.url || "",
      }));
      
      // specialties is [{specialty_id, name}] — join the names
      const specString = specialtiesArr.map((s: any) => s.name || s).filter(Boolean).join(", ");

      setInitialDataStr(JSON.stringify({
        description: about.description || "",
        slogan: about.slogan || "",
        offices: parsedOffices,
        links: parsedLinks,
        specialties: specString,
      }));

      if (!aboutDraft.isInitialized) {
        setAboutDraft({
          description: about.description || "",
          slogan: about.slogan || "",
          offices: parsedOffices,
          links: parsedLinks,
          specialties: specString,
          isInitialized: true,
        });
      }
    }
  }, [aboutData, aboutDraft.isInitialized, setAboutDraft]);

  const currentDataStr = JSON.stringify({ description, slogan, offices, links, specialties });
  const isDirty = initialDataStr !== "" && initialDataStr !== currentDataStr;

  const handleAddOffice = () => {
    const newOffice: Office = {
      id: Date.now().toString(),
      country: "India",
      city: "",
      address: "",
      mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=200&fit=crop",
    };
    setAboutDraft({ offices: [...offices, newOffice] });
  };

  const handleRemoveOffice = (id: string) => {
    setAboutDraft({ offices: offices.filter((o) => o.id !== id) });
  };

  const handleOfficeChange = (id: string, field: keyof Office, value: string) => {
    setAboutDraft({
      offices: offices.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    });
  };

  const handleAddLink = () => {
    const newLink: CustomLink = {
      id: Date.now().toString(),
      label: "",
      platform: MEDIA_OPTIONS[0].value,
      url: "",
    };
    setAboutDraft({ links: [...links, newLink] });
  };

  const handleRemoveLink = (id: string) => {
    setAboutDraft({ links: links.filter((l) => l.id !== id) });
  };

  const handleLinkChange = (id: string, field: keyof CustomLink, value: string) => {
    setAboutDraft({
      links: links.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    });
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => companyProfileService.updateOrgAbout(orgId, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "About info saved successfully!",
      });
      clearAboutDraft();
      queryClient.invalidateQueries({ queryKey: ["orgAbout", slug] });
      queryClient.invalidateQueries({ queryKey: ["orgAbout", orgId] });
      queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
      onCancel();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update about info",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || updateMutation.isPending) return;

    updateMutation.mutate({
      description,
      slogan,
      offices: offices.map((o) => ({ city: o.city, country: o.country, address: o.address })),
      links: links.map((l) => ({
        platform: l.platform,
        display_label: MEDIA_OPTIONS.find((m) => m.value === l.platform)?.label || l.label,
        url: l.url,
      })),
      specialties: specialties.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  if (isLoading) {
    return <div className="py-10 text-center text-zinc-500">Loading about info...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 font-poppins">
      
      {/* Description */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setAboutDraft({ description: e.target.value })}
          rows={4}
          required
          className="w-full p-4 border border-gray-300 dark:border-zinc-800 rounded-2xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8] resize-y"
        />
      </div>

      {/* Slogan */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Slogan
        </label>
        <input
          type="text"
          value={slogan}
          onChange={(e) => setAboutDraft({ slogan: e.target.value })}
          className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
        />
      </div>

      {/* OFFICES Section */}
      <div className="flex justify-between items-center w-full pt-6">
        <h3 className="text-[14px] font-bold text-[#1A73E8] tracking-wider uppercase">
          OFFICES
        </h3>
        <button
          type="button"
          onClick={handleAddOffice}
          className="w-6 h-6 flex items-center justify-center text-[#1A73E8] hover:scale-110 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Offices list */}
      <div className="flex flex-col gap-6 w-full">
        {offices.map((office) => (
          <div key={office.id} className="flex flex-col gap-4 w-full relative p-5 border border-gray-100 dark:border-zinc-800/60 rounded-2xl bg-white/50 dark:bg-zinc-900/20">
            {/* Delete button at top right */}
            <button
              type="button"
              onClick={() => handleRemoveOffice(office.id)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
              title="Remove office"
            >
              <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pr-8">
              {/* Country */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#000000] dark:text-white">
                  Country
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

              {/* City */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#000000] dark:text-white">
                  City
                </label>
                <div 
                  className="relative w-full h-11"
                  ref={(el) => { cityRefs.current[office.id] = el; }}
                >
                  <input
                    type="text"
                    autoComplete="new-password"
                    value={activeCitySearchOfficeId === office.id ? (citySearchQueries[office.id] ?? (office.city === "Select city" ? "" : office.city)) : (office.city === "Select city" ? "" : office.city)}
                    onChange={(e) => {
                      setCitySearchQueries(prev => ({ ...prev, [office.id]: e.target.value }));
                      handleOfficeChange(office.id, "city", e.target.value);
                    }}
                    onFocus={() => {
                      setActiveCitySearchOfficeId(office.id);
                      if (!citySearchQueries[office.id] && office.city && office.city !== "Select city") {
                        setCitySearchQueries(prev => ({ ...prev, [office.id]: office.city }));
                      }
                    }}
                    placeholder="Search city"
                    className="w-full h-full px-4 pr-10 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] focus:outline-none dark:text-white focus:border-[#1A73E8] placeholder-gray-400"
                  />
                  <Icon icon="mynaui:search" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  
                  {activeCitySearchOfficeId === office.id && (citySearchQueries[office.id]?.length > 1 || isSearchingCity) && (
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
                            onMouseDown={() => handleCitySelect(office.id, suggestion.placeId, suggestion.displayName)}
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

            {/* Address */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[14px] font-medium text-[#000000] dark:text-white">
                Address
              </label>
              <input
                type="text"
                autoComplete="new-password"
                value={office.address}
                onChange={(e) => handleOfficeChange(office.id, "address", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
              />
            </div>

            {/* Interactive Google Map Preview */}
            <div className="relative w-full h-[180px] bg-[#E5E9F0] dark:bg-[#111827] rounded-[24px] overflow-hidden border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none flex items-center justify-center">
              {office.country || (office.city && office.city !== "Select city") ? (
                <>
                  <iframe
                    width="100%"
                    height="100%"
                    className="border-0 relative z-0"
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${encodeURIComponent([office.address, office.city === "Select city" ? "" : office.city, office.country].filter(Boolean).join(', '))}&z=${office.city && office.city !== "Select city" ? 14 : 5}&output=embed`}
                  />
                  <a
                    href={`https://maps.google.com/maps?q=${encodeURIComponent([office.address, office.city === "Select city" ? "" : office.city, office.country].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10 cursor-pointer"
                    aria-label="Open in Google Maps"
                  />
                </>
              ) : (
                <div className="text-gray-400 text-sm font-poppins">Select a country or city to view map</div>
              )}

              <div className="absolute bottom-3.5 px-3.5 py-1 bg-white/95 dark:bg-[#1C2840]/95 rounded-full shadow-sm text-center border border-slate-100 dark:border-[#1C2840]/50 flex items-center gap-1 select-none z-20 pointer-events-none">
                <Icon icon="mynaui:map" className="w-3.5 h-3.5 text-slate-500 dark:text-[#A1A8B3]" />
                <span className="text-[10px] font-poppins font-medium text-slate-600 dark:text-[#A1A8B3]">Map Preview</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* SOCIAL LINKS Section */}
      <div className="flex justify-between items-center w-full pt-6">
        <h3 className="text-[14px] font-bold text-[#1A73E8] tracking-wider uppercase">
          SOCIAL LINKS
        </h3>
        <button
          type="button"
          onClick={handleAddLink}
          className="w-6 h-6 flex items-center justify-center text-[#1A73E8] hover:scale-110 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Links list */}
      <div className="flex flex-col gap-6 w-full">
        {links.map((link) => (
          <div key={link.id} className="flex flex-col gap-2 w-full relative p-5 border border-gray-100 dark:border-zinc-800/60 rounded-2xl bg-white/50 dark:bg-zinc-900/20">
            {/* Delete button at top right */}
            <button
              type="button"
              onClick={() => handleRemoveLink(link.id)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
              title="Remove link"
            >
              <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pr-8">
              {/* Media */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#000000] dark:text-white">
                  Media
                </label>
                <div
                  className="relative w-full h-11"
                  ref={(el) => { mediaDropdownRefs.current[link.id] = el; }}
                >
                  <div
                    onClick={() =>
                      setActiveMediaDropdownId((prev) => (prev === link.id ? null : link.id))
                    }
                    className="w-full h-full px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] focus:outline-none dark:text-white focus:border-[#1A73E8] cursor-pointer flex items-center justify-between gap-2 select-none"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon
                        icon={
                          MEDIA_OPTIONS.find((m) => m.value === link.platform)?.icon ||
                          MEDIA_OPTIONS[0].icon
                        }
                        className="w-5 h-5 shrink-0 text-gray-600 dark:text-zinc-300"
                      />
                      <span className="truncate">
                        {MEDIA_OPTIONS.find((m) => m.value === link.platform)?.label ||
                          "Select media"}
                      </span>
                    </span>
                    <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
                  </div>

                  {activeMediaDropdownId === link.id && (
                    <div className="absolute top-[50px] left-0 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-lg rounded-2xl py-2 z-50 max-h-[240px] overflow-y-auto no-scrollbar">
                      {MEDIA_OPTIONS.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => {
                            handleLinkChange(link.id, "platform", opt.value);
                            handleLinkChange(link.id, "label", opt.label);
                            setActiveMediaDropdownId(null);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                        >
                          <Icon icon={opt.icon} className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
                          <span className="text-[14px] text-gray-900 dark:text-white">{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Link URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#000000] dark:text-white">
                  Link
                </label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleLinkChange(link.id, "url", e.target.value)}
                  className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
                />
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Specialties */}
      <div className="flex flex-col gap-2 w-full pt-6">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Specialties
        </label>
        <textarea
          value={specialties}
          onChange={(e) => setAboutDraft({ specialties: e.target.value })}
          rows={3}
          className="w-full p-4 border border-gray-300 dark:border-zinc-800 rounded-2xl bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8] resize-y"
        />
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
          disabled={!isDirty || updateMutation.isPending}
          className={`h-10 px-8 rounded-full font-semibold text-[14px] transition-colors flex items-center justify-center cursor-pointer ${
            isDirty && !updateMutation.isPending
              ? "bg-[#1A73E8] text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
          }`}
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

    </form>
  );
}
