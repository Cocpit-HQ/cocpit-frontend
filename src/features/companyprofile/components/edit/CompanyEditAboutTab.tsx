"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, Plus, MapPin } from "lucide-react";
import { Icon } from "@iconify/react";

interface Office {
  id: string;
  country: string;
  city: string;
  address: string;
  mapUrl: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface CompanyEditAboutTabProps {
  onCancel: () => void;
}

export default function CompanyEditAboutTab({ onCancel }: CompanyEditAboutTabProps) {
  const [description, setDescription] = useState(
    "we are more than just a digital marketing agency; we are your trusted partners in achieving online success. We understand that the digital landscape is ever-evolving, and staying ahead requires innovation, expertise, and creativity. That’s where our team of digital marketing superheroes comes in."
  );
  
  const [slogan, setSlogan] = useState("Innovating the infrastructure of tomorrow, today.");
  
  const [offices, setOffices] = useState<Office[]>([
    {
      id: "1",
      country: "India",
      city: "Mumbai",
      address: "22 Canary Wharf, E14 5AB",
      mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=200&fit=crop",
    },
    {
      id: "2",
      country: "India",
      city: "Bangalore",
      address: "450 Hudson Yards, NY 10001",
      mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=200&fit=crop",
    },
  ]);

  const [links, setLinks] = useState<CustomLink[]>([
    { id: "1", label: "Technova.ai", url: "https://www.nexsus.com" },
    { id: "2", label: "Twitter", url: "https://www.nexsus.com" },
  ]);

  const [specialties, setSpecialties] = useState(
    "mobile app development, Web application development, augmented reality, react native, Android development, iOS development, Virtual reality, Cyber Security, and Software development"
  );

  const handleAddOffice = () => {
    const newOffice: Office = {
      id: Date.now().toString(),
      country: "India",
      city: "Select city",
      address: "",
      mapUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=200&fit=crop",
    };
    setOffices([...offices, newOffice]);
  };

  const handleRemoveOffice = (id: string) => {
    setOffices(offices.filter((o) => o.id !== id));
  };

  const handleOfficeChange = (id: string, field: keyof Office, value: string) => {
    setOffices(
      offices.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleAddLink = () => {
    const newLink: CustomLink = {
      id: Date.now().toString(),
      label: "",
      url: "",
    };
    setLinks([...links, newLink]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const handleLinkChange = (id: string, field: keyof CustomLink, value: string) => {
    setLinks(
      links.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("About info saved successfully!");
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 font-poppins">
      
      {/* Description */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[14px] font-medium text-[#000000] dark:text-white">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          onChange={(e) => setSlogan(e.target.value)}
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
          <div key={office.id} className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
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
                <div className="relative w-full h-11">
                  <select
                    value={office.city}
                    onChange={(e) => handleOfficeChange(office.id, "city", e.target.value)}
                    className="w-full h-full px-4 pr-10 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] appearance-none focus:outline-none dark:text-white focus:border-[#1A73E8]"
                  >
                    <option value="Select city" disabled>Select city</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
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
                value={office.address}
                onChange={(e) => handleOfficeChange(office.id, "address", e.target.value)}
                className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
              />
            </div>

            {/* Google Map Mock with Pin Marker */}
            <div className="relative w-full h-[180px] bg-slate-100 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800">
              <Image
                src={office.mapUrl}
                alt="Map View"
                fill
                className="object-cover opacity-90"
                unoptimized
              />
              {/* Centered Map Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <MapPin className="w-8 h-8 text-red-500 fill-red-100 drop-shadow-lg animate-bounce" />
              </div>
            </div>

            {/* Delete button below map */}
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={() => handleRemoveOffice(office.id)}
                className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                title="Remove office"
              >
                <Icon icon="hugeicons:delete-02" className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LINKS Section */}
      <div className="flex justify-between items-center w-full pt-6">
        <h3 className="text-[14px] font-bold text-[#1A73E8] tracking-wider uppercase">
          LINKS
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
          <div key={link.id} className="flex flex-col gap-2 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Label */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-[#000000] dark:text-white">
                  Label
                </label>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleLinkChange(link.id, "label", e.target.value)}
                  className="w-full h-11 px-4 border border-gray-300 dark:border-zinc-800 rounded-full bg-transparent text-[16px] placeholder-gray-400 focus:outline-none dark:text-white focus:border-[#1A73E8]"
                />
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

            {/* Delete button below link */}
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={() => handleRemoveLink(link.id)}
                className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                title="Remove link"
              >
                <Icon icon="hugeicons:delete-02" className="w-6 h-6" />
              </button>
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
          onChange={(e) => setSpecialties(e.target.value)}
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
          className="h-10 px-8 rounded-full bg-[#1A73E8] text-white hover:bg-blue-700 font-semibold text-[14px] transition-colors flex items-center justify-center cursor-pointer"
        >
          Save
        </button>
      </div>

    </form>
  );
}
