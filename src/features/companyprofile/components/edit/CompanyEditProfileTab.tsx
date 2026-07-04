"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CompanyEditProfileTabProps {
  onCancel: () => void;
}

export default function CompanyEditProfileTab({ onCancel }: CompanyEditProfileTabProps) {
  // Mock initial state
  const [formData, setFormData] = useState({
    name: "Nexsus Global Systems",
    industry: "Technology",
    foundedYear: "2026",
    size: "1 - 10 Members",
    website: "https://www.nexsus.com",
    country: "India",
    city: "Mumbai",
    headline: "SaaS and Fintech Solutions",
  });

  const [initialData] = useState({ ...formData });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    alert("Profile changes saved successfully!");
    onCancel();
  };

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
          <div className="relative w-full h-11">
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full h-full px-4 pr-10 border border-gray-300 dark:border-zinc-800 rounded-xl bg-transparent text-[16px] appearance-none focus:outline-none dark:text-white focus:border-[#1A73E8]"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="New York">New York</option>
              <option value="London">London</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
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
