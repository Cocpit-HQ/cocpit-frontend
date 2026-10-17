"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Search, MapPin, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  searchPlaces,
  getPlaceDetails,
  PlacesSuggestion,
  StructuredLocation,
} from "@/services/api/location";
import InteractiveLocationMap from "@/features/company-onboarding/components/InteractiveLocationMap";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { useToast } from "@/hooks/use-toast";
import {
  useBusinessEditStore,
  Office,
  CustomLink,
} from "../../store/useBusinessEditStore";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";

const POPULAR_OFFICE_LOCATIONS = [
  "Mumbai, Maharashtra, India",
  "Bengaluru, Karnataka, India",
  "New York, NY, USA",
  "San Francisco, CA, USA",
  "Dubai, United Arab Emirates",
  "Singapore",
  "Austin, TX, USA",
];

const MEDIA_OPTIONS = [
  { value: "cocpit", label: "Cocpit", shortLabel: "Cocpit", placeholder: "www.cocpit.com" },
  { value: "x", label: "X (Twitter)", shortLabel: "X (Twitter)", placeholder: "www.x.com" },
  { value: "instagram", label: "Instagram", shortLabel: "Instagram", placeholder: "www.instagram.com" },
  { value: "facebook", label: "Facebook", shortLabel: "Facebook", placeholder: "www.facebook.com" },
  { value: "youtube", label: "YouTube", shortLabel: "YouTube", placeholder: "www.youtube.com" },
  { value: "discord", label: "Discord", shortLabel: "Discord", placeholder: "www.discord.com" },
];

function getMediaPlaceholder(platform?: string): string {
  const p = (platform || "").toLowerCase().trim();
  if (p === "twitter") return "www.x.com";
  const matched = MEDIA_OPTIONS.find((m) => m.value === p);
  return matched?.placeholder || "www.cocpit.com";
}

interface BusinessEditAboutTabProps {
  onCancel: () => void;
  orgId: string;
  orgProfile?: any;
}

const DEFAULT_KEY_OFFERING_METAS = [
  { icon: "iconoir:rocket", label: "Rocket" },
  { icon: "lucide:trending-up", label: "Trending Up" },
  { icon: "iconoir:globe", label: "Globe" },
  { icon: "iconoir:lightbulb", label: "Lightbulb" },
];

function parseAboutPayload(rawAbout: any, rawProfile?: any) {
  const about = rawAbout?.about || rawAbout || {};
  const officesArr = rawAbout?.offices || [];
  const linksArr = rawAbout?.links || [];
  const specialtiesArr = rawAbout?.specialties || [];

  const org = rawProfile?.org || rawProfile?.organization || rawProfile || {};
  const offeringsArr =
    org.key_offerings ||
    org.keyOfferings ||
    rawAbout?.key_offerings ||
    rawAbout?.keyOfferings ||
    rawAbout?.about?.key_offerings ||
    [];

  const offices: Office[] = officesArr.map((o: any, idx: number) => ({
    id: o.office_id || o.id || String(idx),
    country: o.country || "",
    city: o.city || "",
    address: o.address || "",
    mapUrl: o.mapUrl || o.map_url || "",
    latitude: o.latitude ? Number(o.latitude) : null,
    longitude: o.longitude ? Number(o.longitude) : null,
  }));

  const links: CustomLink[] = linksArr.map((l: any, idx: number) => {
    let p = (l.platform || "cocpit").toLowerCase().trim();
    if (p === "twitter") p = "x";
    const matched = MEDIA_OPTIONS.find((m) => m.value === p);
    return {
      id: l.link_id || l.id || String(idx),
      label:
        l.display_label ||
        matched?.label ||
        l.label ||
        (p ? p.charAt(0).toUpperCase() + p.slice(1) : "Cocpit"),
      platform: matched ? matched.value : "cocpit",
      url: l.url || "",
    };
  });

  const specialties = specialtiesArr
    .map((s: any) => s.name || s)
    .filter(Boolean)
    .join(", ");

  const getOfferingText = (item: any) => {
    if (!item) return "";
    const str = typeof item === "string" ? item : item.content || item.title || item.label || "";
    return str.slice(0, 60);
  };

  const keyOfferings: string[] = [
    getOfferingText(offeringsArr[0]),
    getOfferingText(offeringsArr[1]),
    getOfferingText(offeringsArr[2]),
    getOfferingText(offeringsArr[3]),
  ];

  return {
    description: about.description || "",
    slogan: about.slogan || "",
    offices,
    links,
    specialties,
    keyOfferings,
  };
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      maxLength={maxLength}
      onChange={(e) => {
        onChange(e);
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      placeholder={placeholder}
      className={cn(
        "self-stretch text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none resize-none overflow-hidden p-0 m-0 placeholder:text-ds-text-muted",
        className,
      )}
    />
  );
}

export default function BusinessEditAboutTab({
  onCancel,
  orgId,
  orgProfile,
}: BusinessEditAboutTabProps) {
  const { slug } = useParams() as { slug: string };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aboutData, isLoading: isAboutLoading } = useQuery({
    queryKey: ["orgAbout", slug],
    queryFn: () => businessProfileService.getOrgAbout(slug),
  });

  const { data: profileQueryData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["orgProfile", slug],
    queryFn: () => businessProfileService.getOrgProfile(slug),
    enabled: !orgProfile,
  });

  const effectiveProfile =
    orgProfile ||
    profileQueryData?.org ||
    profileQueryData?.organization ||
    profileQueryData;

  const org =
    effectiveProfile?.org ||
    effectiveProfile?.organization ||
    effectiveProfile ||
    {};
  const about = aboutData?.about || aboutData || {};

  const isInstitution =
    org.entity_type === "INSTITUTION" ||
    org.entityType === "INSTITUTION" ||
    about.entity_type === "INSTITUTION" ||
    about.entityType === "INSTITUTION" ||
    Boolean(org.institution_type || about.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes(
      ((org.institution_type || org.industry || about.industry) || "").toLowerCase().trim()
    );

  const isLoading = isAboutLoading || (!orgProfile && isProfileLoading);

  const { aboutDraft, setAboutDraft, clearAboutDraft, hydrateAboutDraft } =
    useBusinessEditStore();
  const description = aboutDraft.description;
  const slogan = aboutDraft.slogan;
  const offices = aboutDraft.offices;
  const links = aboutDraft.links;
  const specialties = aboutDraft.specialties;
  const [keyOfferings, setKeyOfferings] = useState<string[]>(["", "", "", ""]);
  const [isDirty, setIsDirty] = useState(false);

  const sessionToken = useRef(uuidv4());
  const [activeCitySearchOfficeId, setActiveCitySearchOfficeId] = useState<
    string | null
  >(null);
  const [citySearchQueries, setCitySearchQueries] = useState<
    Record<string, string>
  >({});
  const [citySuggestions, setCitySuggestions] = useState<PlacesSuggestion[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const cityRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [openMediaDropdownId, setOpenMediaDropdownId] = useState<string | null>(
    null,
  );
  const mediaDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>(
    {},
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activeCitySearchOfficeId &&
        cityRefs.current[activeCitySearchOfficeId]
      ) {
        if (
          !cityRefs.current[activeCitySearchOfficeId]!.contains(
            event.target as Node,
          )
        ) {
          setActiveCitySearchOfficeId(null);
        }
      }
      if (
        openMediaDropdownId &&
        mediaDropdownRefs.current[openMediaDropdownId]
      ) {
        if (
          !mediaDropdownRefs.current[openMediaDropdownId]!.contains(
            event.target as Node,
          )
        ) {
          setOpenMediaDropdownId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeCitySearchOfficeId, openMediaDropdownId]);

  useEffect(() => {
    if (!activeCitySearchOfficeId) return;
    const query = citySearchQueries[activeCitySearchOfficeId] || "";

    const delay = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearchingCity(true);
        try {
          const results = await searchPlaces(
            query.trim(),
            sessionToken.current,
            undefined,
            true,
          );
          setCitySuggestions(results || []);
        } catch (e) {
          console.error("Failed to fetch locations", e);
          setCitySuggestions([]);
        } finally {
          setIsSearchingCity(false);
        }
      } else {
        setCitySuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [citySearchQueries, activeCitySearchOfficeId]);

  const handleOfficeCitySelect = async (
    officeId: string,
    placeId?: string,
    description?: string,
  ) => {
    if (!description) return;
    setIsDirty(true);
    let city = "";
    let country = "";
    let address = description;
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (placeId) {
      try {
        const details = await getPlaceDetails(placeId, sessionToken.current, true);
        sessionToken.current = uuidv4();
        if (details) {
          city = details.city || "";
          country = details.country || "";
          address = details.formattedAddress || details.city || description;
          latitude = details.latitude ?? null;
          longitude = details.longitude ?? null;
        }
      } catch (e) {
        console.error("Failed to get place details", e);
      }
    }

    if (!city) {
      const parts = description.split(",");
      city = parts[0]?.trim() || "";
      country = parts[parts.length - 1]?.trim() || "";
      address = description;
    }

    setCitySearchQueries((prev) => ({
      ...prev,
      [officeId]: address,
    }));

    setAboutDraft({
      offices: offices.map((o) =>
        o.id === officeId
          ? {
              ...o,
              city: city || o.city,
              country: country || o.country,
              address: address || o.address,
              latitude: latitude ?? o.latitude,
              longitude: longitude ?? o.longitude,
            }
          : o
      ),
    });
    setActiveCitySearchOfficeId(null);
  };

  const handleMapLocationChange = (officeId: string, loc: StructuredLocation) => {
    if (!loc) return;
    setIsDirty(true);
    const resolvedAddress =
      loc.formattedAddress ||
      [loc.street, loc.sublocality, loc.city, loc.state, loc.country]
        .filter(Boolean)
        .join(", ");

    setCitySearchQueries((prev) => ({
      ...prev,
      [officeId]: resolvedAddress,
    }));

    setAboutDraft({
      offices: offices.map((o) =>
        o.id === officeId
          ? {
              ...o,
              address: resolvedAddress || o.address,
              city: loc.city || o.city,
              country: loc.country || o.country,
              latitude: loc.latitude,
              longitude: loc.longitude,
            }
          : o
      ),
    });
  };

  useEffect(() => {
    if (aboutData) {
      const parsed = parseAboutPayload(aboutData, effectiveProfile);
      setKeyOfferings(parsed.keyOfferings);
      hydrateAboutDraft(parsed, slug);
      setIsDirty(false);
    }
  }, [aboutData, effectiveProfile, slug, hydrateAboutDraft]);

  const handleAddOffice = () => {
    setIsDirty(true);
    const newOffice: Office = {
      id: uuidv4(),
      country: "",
      city: "",
      address: "",
      mapUrl: "",
      latitude: null,
      longitude: null,
    };
    setAboutDraft({ offices: [...offices, newOffice] });
  };

  const handleRemoveOffice = (id: string) => {
    setIsDirty(true);
    setAboutDraft({ offices: offices.filter((o) => o.id !== id) });
  };

  const handleOfficeChange = (
    id: string,
    field: keyof Office,
    value: string,
  ) => {
    setIsDirty(true);
    setAboutDraft({
      offices: offices.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    });
  };

  const handleOfferingChange = (idx: number, val: string) => {
    setIsDirty(true);
    setKeyOfferings((prev) => {
      const next = [...prev];
      next[idx] = val.slice(0, 60);
      return next;
    });
  };

  const handleAddLink = () => {
    setIsDirty(true);
    const newLink: CustomLink = {
      id: uuidv4(),
      label: "Cocpit",
      platform: "cocpit",
      url: "",
    };
    setAboutDraft({ links: [...links, newLink] });
  };

  const handleRemoveLink = (id: string) => {
    setIsDirty(true);
    setAboutDraft({ links: links.filter((l) => l.id !== id) });
  };

  const handleLinkChange = (
    id: string,
    field: keyof CustomLink,
    value: string,
  ) => {
    setIsDirty(true);
    setAboutDraft({
      links: links.map((l) => {
        if (l.id !== id) return l;
        if (field === "platform") {
          const matched = MEDIA_OPTIONS.find((m) => m.value === value);
          return { ...l, platform: value, label: matched?.label || value };
        }
        return { ...l, [field]: value };
      }),
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Update org about (description, slogan, offices, links, specialties)
      const aboutRes = await businessProfileService.updateOrgAbout(orgId, {
        description: data.description,
        slogan: data.slogan,
        offices: data.offices,
        links: data.links,
        specialties: data.specialties,
      });

      // 2. Update org profile with key offerings and preserve org details
      if (data.keyOfferings !== undefined) {
        const orgName = effectiveProfile?.name;
        if (!orgName) {
          throw new Error("Organization name is missing. Unable to update key offerings.");
        }

        await businessProfileService.updateOrgProfile(orgId, {
          name: orgName,
          description: data.description,
          slogan: data.slogan,
          headline: effectiveProfile?.headline || effectiveProfile?.tagline || undefined,
          industry: effectiveProfile?.industry || undefined,
          size: effectiveProfile?.size || effectiveProfile?.employeeCount || undefined,
          website: effectiveProfile?.website || effectiveProfile?.websiteUrl || undefined,
          country: effectiveProfile?.country || undefined,
          city: effectiveProfile?.city || undefined,
          established_year: effectiveProfile?.established_year ? parseInt(effectiveProfile.established_year) : undefined,
          keyOfferings: data.keyOfferings,
        });
      }

      return aboutRes;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "About section saved successfully!",
      });

      setIsDirty(false);

      hydrateAboutDraft(
        {
          description,
          slogan,
          offices,
          links,
          specialties,
          keyOfferings,
        },
        slug,
      );

      queryClient.setQueryData(["orgAbout", slug], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          about: {
            ...(old.about || old),
            description,
            slogan,
          },
          specialties: specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          keyOfferings,
          offices,
          links,
        };
      });

      // Optimistically update orgProfile with key_offerings
      queryClient.setQueryData(["orgProfile", slug], (old: any) => {
        if (!old) return old;
        const currentOrg = old.org || old.organization || old;
        const updatedOrg = {
          ...currentOrg,
          key_offerings: variables.keyOfferings,
          keyOfferings: variables.keyOfferings,
        };
        return {
          ...old,
          org: updatedOrg,
          organization: updatedOrg,
        };
      });

      queryClient.invalidateQueries({
        queryKey: ["orgAbout"],
      });
      queryClient.invalidateQueries({
        queryKey: ["orgProfile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["companyProfile"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || error?.message || "Failed to update about section",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || updateMutation.isPending) return;

    const formattedOfferings = keyOfferings
      .map((text, idx) => {
        const trimmed = text.trim().slice(0, 60);
        if (!trimmed) return null;
        const meta = DEFAULT_KEY_OFFERING_METAS[idx % DEFAULT_KEY_OFFERING_METAS.length];
        return {
          icon: meta.icon,
          label: meta.label,
          content: trimmed,
        };
      })
      .filter(Boolean);

    updateMutation.mutate({
      description,
      slogan,
      offices: offices
        .filter((o) => Boolean(o.city?.trim() || o.address?.trim() || o.country?.trim()))
        .map((o) => ({
          country: o.country?.trim() || "",
          city: o.city?.trim() || "",
          address: o.address?.trim() || "",
        })),
      links: links.map((l) => ({
        platform: l.platform,
        url: l.url,
        display_label: l.label,
      })),
      specialties: Array.from(
        new Set(
          specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      ),
      keyOfferings: formattedOfferings,
    });
  };

  const handleCancel = () => {
    if (aboutData) {
      const parsed = parseAboutPayload(aboutData, effectiveProfile);
      hydrateAboutDraft(parsed, slug);
      setKeyOfferings(parsed.keyOfferings);
    }
    setIsDirty(false);
    onCancel();
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-ds-text-muted font-['DM_Sans']">
        Loading about...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full flex flex-col items-center gap-10 transition-[padding] duration-200",
        openMediaDropdownId ? "pb-30" : "pb-12",
      )}
    >
      {/* Form Container (w-[640px] matching Figma layout) */}
      <div className="w-full max-w-[640px] flex flex-col justify-start items-start gap-10">
        {/* Field 1: Description (Frame 2609639) */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
            <label className="text-center justify-start text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
              Description
            </label>
            <AutoResizeTextarea
              value={description}
              maxLength={500}
              onChange={(e) => {
                setIsDirty(true);
                setAboutDraft({ description: e.target.value });
              }}
              placeholder={
                isInstitution
                  ? "Describe your institute and what makes it unique."
                  : "Describe your company and what makes it unique."
              }
            />
          </div>
          <div className="text-center justify-start text-ds-text-muted text-xs font-normal font-['DM_Sans'] leading-4">
            {description?.length || 0}/500
          </div>
        </div>

        {/* Field 2: Slogan (Frame 2609642) */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
            <label className="text-center justify-start text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
              Slogan
            </label>
            <AutoResizeTextarea
              value={slogan}
              maxLength={120}
              onChange={(e) => {
                setIsDirty(true);
                setAboutDraft({ slogan: e.target.value });
              }}
              placeholder={
                isInstitution
                  ? "Add a short slogan that represents your institute’s vision"
                  : "Add a short slogan that represents your company’s vision"
              }
            />
          </div>
          <div className="text-center justify-start text-ds-text-muted text-xs font-normal font-['DM_Sans'] leading-4">
            {slogan?.length || 0}/120
          </div>
        </div>

        {/* Field 3: Speciality (Frame 2609643) */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
            <label className="text-center justify-start text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
              Speciality
            </label>
            <AutoResizeTextarea
              value={specialties}
              maxLength={500}
              onChange={(e) => {
                setIsDirty(true);
                setAboutDraft({ specialties: e.target.value });
              }}
              placeholder="Add a speciality"
            />
          </div>
          <div className="text-center justify-start text-ds-text-muted text-xs font-normal font-['DM_Sans'] leading-4">
            {specialties?.length || 0}/500
          </div>
        </div>

        {/* Field 4: Key offerings (Frame 2609928) */}
        <div className="self-stretch flex flex-col justify-start items-start gap-3">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="text-center justify-start text-ds-text-secondary text-base font-medium font-['DM_Sans'] leading-6">
              Key offerings
            </div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            {keyOfferings.map((item, idx) => (
              <div
                key={idx}
                className="self-stretch flex flex-col justify-start items-end gap-2"
              >
                <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
                  <input
                    type="text"
                    maxLength={60}
                    value={item}
                    onChange={(e) => handleOfferingChange(idx, e.target.value)}
                    placeholder="Add your key offerings here."
                    className="self-stretch text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none p-0 m-0 placeholder:text-ds-text-muted"
                  />
                </div>
                <div className="text-center justify-start text-ds-text-muted text-xs font-normal font-['DM_Sans'] leading-4">
                  {item?.length || 0}/60
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Field 5: Offices (Matching Figma layout with onboarding Google Places & Interactive Map) */}
        <div className="self-stretch flex flex-col justify-start items-start gap-3">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="text-center justify-start text-ds-text-secondary text-base font-medium font-['DM_Sans'] leading-6">
              Offices
            </div>
            <button
              type="button"
              onClick={handleAddOffice}
              className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer"
              aria-label="Add office"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {offices.map((office, idx) => {
            const officeLocationText =
              citySearchQueries[office.id] !== undefined
                ? citySearchQueries[office.id]
                : [office.address, office.city, office.country].filter(Boolean).join(", ") || "";

            return (
              <div
                key={office.id}
                className="self-stretch flex flex-col justify-start items-end gap-2"
              >
                {/* Location Input with Search & Suggestions */}
                <div
                  ref={(el) => {
                    cityRefs.current[office.id] = el;
                  }}
                  className="self-stretch py-2 border-b border-ds-border focus-within:border-ds-accent flex flex-col justify-center items-start gap-2.5 relative transition-colors"
                >
                  <label className="text-center justify-start text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                    Office Location #{idx + 1}
                  </label>
                  <div className="w-full inline-flex justify-between items-center gap-2">
                    <input
                      type="text"
                      value={officeLocationText}
                      onChange={(e) => {
                        setCitySearchQueries((prev) => ({
                          ...prev,
                          [office.id]: e.target.value,
                        }));
                        if (activeCitySearchOfficeId !== office.id) {
                          setActiveCitySearchOfficeId(office.id);
                        }
                      }}
                      onFocus={() => {
                        setActiveCitySearchOfficeId(office.id);
                        if (citySearchQueries[office.id] === undefined) {
                          setCitySearchQueries((prev) => ({
                            ...prev,
                            [office.id]: officeLocationText,
                          }));
                        }
                      }}
                      placeholder="Search office location..."
                      maxLength={255}
                      className="w-full bg-transparent text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 focus:outline-none placeholder:text-ds-text-muted cursor-text"
                    />
                    {isSearchingCity ? (
                      <Loader2 className="w-4 h-4 animate-spin text-ds-accent shrink-0" />
                    ) : (
                      <Search className="w-4 h-4 text-ds-text-secondary shrink-0" />
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {activeCitySearchOfficeId === office.id && (
                    <div className="absolute top-full left-0 mt-2 w-full p-2 bg-ds-bg rounded-xl border border-ds-border shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in duration-150 max-h-56 overflow-y-auto scrollbar-none [scrollbar-width:none]">
                      {isSearchingCity ? (
                        <div className="w-full py-3 flex items-center justify-center gap-2 text-xs text-ds-text-muted font-['DM_Sans']">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-ds-accent" />
                          <span>Searching locations...</span>
                        </div>
                      ) : citySuggestions.length > 0 ? (
                        citySuggestions.map((place: PlacesSuggestion) => (
                          <div
                            key={place.placeId || place.description}
                            onClick={() =>
                              handleOfficeCitySelect(
                                office.id,
                                place.placeId,
                                place.description || place.displayName,
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1/50 cursor-pointer transition-colors font-['DM_Sans']"
                          >
                            <MapPin className="w-4 h-4 text-ds-accent shrink-0" />
                            <span className="truncate">{place.description || place.displayName}</span>
                          </div>
                        ))
                      ) : POPULAR_OFFICE_LOCATIONS.length > 0 ? (
                        <>
                          <div className="px-3 py-1 text-[11px] font-medium text-ds-text-muted uppercase tracking-wider font-['DM_Sans']">
                            Popular Locations
                          </div>
                          {POPULAR_OFFICE_LOCATIONS.map((loc) => (
                            <div
                              key={loc}
                              onClick={() => handleOfficeCitySelect(office.id, undefined, loc)}
                              className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1/50 cursor-pointer transition-colors font-['DM_Sans']"
                            >
                              <MapPin className="w-4 h-4 text-ds-text-muted shrink-0" />
                              <span className="truncate">{loc}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="w-full py-3 text-center text-xs text-ds-text-muted font-['DM_Sans']">
                          No locations found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Interactive Map */}
                <div className="self-stretch rounded-2xl overflow-hidden">
                  <InteractiveLocationMap
                    locationAddress={officeLocationText || "Mumbai, Maharashtra, India"}
                    latitude={office.latitude}
                    longitude={office.longitude}
                    onLocationChange={(loc) => handleMapLocationChange(office.id, loc)}
                    className="w-full"
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveOffice(office.id)}
                  className="text-center justify-start text-ds-error text-xs font-normal font-['DM_Sans'] leading-4 no-underline hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>

        {/* Field 6: Social links (Frame 2609679) */}
        <div className="self-stretch flex flex-col justify-start items-start gap-3">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="text-center justify-start text-ds-text-secondary text-base font-medium font-['DM_Sans'] leading-6">
              Social links
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer"
              aria-label="Add social link"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {links.map((link) => (
            <div
              key={link.id}
              className="self-stretch flex flex-col justify-start items-end gap-2"
            >
              <div className="self-stretch inline-flex justify-start items-center gap-3 sm:gap-5">
                {/* Media Selector */}
                <div
                  ref={(el) => {
                    mediaDropdownRefs.current[link.id] = el;
                  }}
                  className="w-[130px] sm:w-[140px] py-2 inline-flex flex-col justify-center items-start gap-2.5 relative shrink-0"
                >
                  <label className="text-center justify-start text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                    Media
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Select social media platform"
                      aria-expanded={openMediaDropdownId === link.id}
                      aria-haspopup="listbox"
                      onClick={() => {
                        const next =
                          openMediaDropdownId === link.id ? null : link.id;
                        setOpenMediaDropdownId(next);
                      }}
                      className="inline-flex justify-start items-center gap-1.5 sm:gap-2.5 bg-transparent cursor-pointer py-0.5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ds-accent"
                    >
                      <div className="w-[100px] sm:w-[110px] h-9 rounded-3xl flex justify-start items-center gap-2">
                        <Icon
                          name={
                            (link.platform === "twitter" ? "x" : link.platform || "cocpit").toLowerCase() as any
                          }
                          size={20}
                          className="w-5 h-5 shrink-0 text-ds-text-primary"
                        />
                        <span className="text-start justify-start text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 truncate">
                          {MEDIA_OPTIONS.find(
                            (m) =>
                              m.value ===
                              (link.platform === "twitter" ? "x" : link.platform),
                          )?.label || "Cocpit"}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 sm:w-5 sm:h-5 text-ds-text-primary shrink-0 flex-none transition-transform duration-150",
                          openMediaDropdownId === link.id && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Media Dropdown Panel */}
                    {openMediaDropdownId === link.id && (
                      <div
                        role="listbox"
                        aria-label="Social media platforms"
                        className="absolute top-[calc(100%+4px)] left-0 z-[100] w-[122px] h-[300px] p-3 flex flex-col items-center gap-3 rounded-[16px] bg-ds-bg border border-ds-border box-border shadow-2xl overflow-hidden"
                      >
                        {MEDIA_OPTIONS.map((m) => {
                          const isSelected = link.platform === m.value;
                          return (
                            <button
                              key={m.value}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              aria-label={m.label}
                              onClick={() => {
                                handleLinkChange(link.id, "platform", m.value);
                                setOpenMediaDropdownId(null);
                              }}
                              className="w-[98px] h-9 px-1 rounded-[24px] flex flex-row items-center gap-2.5 transition-colors shrink-0 cursor-pointer outline-none bg-transparent hover:bg-ds-surface-1 focus-visible:bg-ds-surface-1 focus-visible:ring-1 focus-visible:ring-ds-accent"
                            >
                              <Icon
                                name={m.value as any}
                                size={20}
                                className={cn(
                                  "w-5 h-5 shrink-0 transition-colors",
                                  isSelected ? "text-ds-accent" : "text-ds-text-primary",
                                )}
                              />
                              <span
                                className={cn(
                                  "text-sm font-normal font-['DM_Sans'] leading-5 whitespace-nowrap transition-colors",
                                  isSelected ? "text-ds-accent" : "text-ds-text-primary",
                                )}
                              >
                                {m.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Link URL */}
                <div className="flex-1 min-w-0 py-2 border-b border-ds-border inline-flex flex-col justify-center items-start gap-2.5">
                  <label className="text-center justify-start text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                    Link
                  </label>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) =>
                      handleLinkChange(link.id, "url", e.target.value)
                    }
                    placeholder={getMediaPlaceholder(link.platform)}
                    maxLength={255}
                    className="self-stretch w-full text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 bg-transparent focus:outline-none p-0 m-0 placeholder:text-ds-text-muted"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveLink(link.id)}
                className="text-center text-ds-error text-xs font-normal font-['DM_Sans'] leading-4 no-underline hover:opacity-80 transition-opacity cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: Save & Cancel (Frame 2609476) */}
      <div className="inline-flex justify-center items-start gap-2">
        <button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className={cn(
            "w-[77px] h-9 px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-6 transition-colors",
            !isDirty || updateMutation.isPending
              ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-not-allowed pointer-events-none"
              : "bg-[var(--ds-accent)] text-white hover:opacity-90 cursor-pointer",
          )}
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="w-[77px] h-9 px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 hover:bg-[var(--ds-surface-1)] cursor-pointer transition-colors flex justify-center items-center"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
