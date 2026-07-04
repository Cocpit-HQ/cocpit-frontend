"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { Search } from "lucide-react";

interface PeopleTabProps {
  data: CompanyProfileData;
}

export default function PeopleTab({ data }: PeopleTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isEdu = data.entityType === "INSTITUTE";

  const distributions = [
    {
      title: "Location Distribution",
      items: [
        { label: "London", value: 42 },
        { label: "New York", value: 35 },
        { label: "San Francisco", value: 23 },
      ],
    },
    {
      title: isEdu ? "Skilled At" : "Top Skills",
      items: [
        { label: "UI Design", value: 60 },
        { label: "React", value: 55 },
        { label: "Project Mgmt", value: 45 },
      ],
    },
    {
      title: isEdu ? "Profession" : "Role Distribution",
      items: [
        { label: "Engineering", value: 50 },
        { label: "Design", value: 20 },
        { label: "Marketing", value: 30 },
      ],
    },
    {
      title: "Education Breakdown",
      items: [
        { label: "Stanford", value: 12 },
        { label: "Oxford", value: 10 },
        { label: "MIT", value: 8 },
      ],
    },
  ];

  const employees = [
    {
      id: "1",
      name: "Alex Rivera",
      role: "Principal Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      action: "view",
      textWidth: "125px",
    },
    {
      id: "2",
      name: "Jordan Smyth",
      role: "VP Engineering",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      action: "connect",
      textWidth: "114px",
    },
    {
      id: "3",
      name: "David Miller",
      role: "Senior Engineer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      action: "connect",
      textWidth: "108px",
    },
  ];

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 w-full bg-white dark:bg-zinc-950 rounded-2xl">
        <div className="relative w-64 h-48 mb-6">
          <Image
            src={isEdu ? "/images/companyonboarding/EmptyViewAlumini.png" : "/images/companyonboarding/EmptyViewOfPeople.png"}
            alt={isEdu ? "No Alumni" : "No Associates"}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        {isEdu ? (
          <>
            <h3 className="font-poppins font-semibold text-lg text-black dark:text-white mb-1">
              No Alumni
            </h3>
            <p className="font-poppins text-sm text-gray-500 dark:text-zinc-400 text-center">
              <span className="font-semibold text-black dark:text-white">{data.name}</span> doesn't have any alumni yet.
            </p>
          </>
        ) : (
          <p className="font-poppins text-sm text-gray-500 dark:text-zinc-400 text-center">
            <span className="font-semibold text-black dark:text-white">{data.name}</span> doesn't have any associates yet
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        gap: "16px",
        width: "960px",
        background: "#FFFFFF",
        borderRadius: "12px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="dark:bg-zinc-950 font-poppins"
    >
      {/* Frame 2609104: Title & Subtitle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "0px",
          gap: "4px",
          width: "920px",
          height: "55px",
          flex: "none",
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        <h2
          style={{
            width: "920px",
            height: "27px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "18px",
            lineHeight: "27px",
            display: "flex",
            alignItems: "center",
            color: "#000000",
            flex: "none",
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="dark:text-white"
        >
          {isEdu ? "Student at this institute" : "People at this company"}
        </h2>
        <span
          style={{
            width: "920px",
            height: "24px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "24px",
            display: "flex",
            alignItems: "center",
            color: "#6B7280",
            flex: "none",
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="dark:text-zinc-400"
        >
          {isEdu ? "Find and explore students" : "Find and explore employees"}
        </span>
      </div>

      {/* Frame 2609134: Search & Associates */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "40px",
          flex: "none",
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        {/* Search Input Card */}
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 16px",
            gap: "10px",
            width: "360px",
            height: "40px",
            border: "1px solid #6B7280",
            borderRadius: "24px",
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          className="dark:border-zinc-800"
        >
          <input
            type="text"
            placeholder="Search keyword"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "290px",
              height: "24px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#6B7280",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
            className="dark:text-zinc-300"
          />
          <Search className="w-6 h-6 text-[#6B7280] flex-shrink-0" />
        </div>

        {/* Frame 2608515: Associates Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px 16px",
            gap: "10px",
            width: "133px",
            height: "40px",
            background: "#EFF4FF",
            borderRadius: "24px",
            flex: "none",
            order: 1,
            flexGrow: 0,
          }}
          className="dark:bg-zinc-900"
        >
          <span
            style={{
              width: "101px",
              height: "16px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "16px",
              textAlign: "center",
              color: "#6B7280",
              flex: "none",
              order: 0,
              flexGrow: 0,
            }}
            className="dark:text-zinc-300"
          >
            {isEdu ? "123 Alumni" : "123 Associates"}
          </span>
        </div>
      </div>

      {/* Frame 2609133: Distribution Cards Grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "206px",
          flex: "none",
          order: 2,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
        className="flex-wrap md:flex-nowrap h-auto md:h-[206px]"
      >
        {distributions.map((dist, idx) => (
          <div
            key={idx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "16px",
              gap: "24px",
              width: "218px",
              height: "206px",
              background: "#FFFFFF",
              border: "1px solid #E8F1FF",
              borderRadius: "24px",
              flex: "none",
              order: idx,
              flexGrow: 1,
            }}
            className="dark:bg-zinc-950 dark:border-zinc-900"
          >
            {/* Heading 4 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0px",
                width: "184px",
                height: "20px",
                flex: "none",
                order: 0,
                alignSelf: "stretch",
                flexGrow: 0,
              }}
            >
              <h4
                style={{
                  width: "184px",
                  height: "20px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "20px",
                  display: "flex",
                  alignItems: "center",
                  letterSpacing: "0.14px",
                  color: "#000000",
                  flex: "none",
                  order: 0,
                  alignSelf: "stretch",
                  flexGrow: 0,
                }}
                className="dark:text-white"
              >
                {dist.title}
              </h4>
            </div>

            {/* Bars Container */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0px",
                gap: "16px",
                width: "184px",
                height: "128px",
                flex: "none",
                order: 1,
                alignSelf: "stretch",
                flexGrow: 0,
              }}
            >
              {dist.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    gap: "8px",
                    width: "184px",
                    height: "32px",
                    flex: "none",
                    order: itemIdx,
                    alignSelf: "stretch",
                    flexGrow: 0,
                  }}
                >
                  {/* Label Row */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "0px",
                      width: "184px",
                      height: "16px",
                      flex: "none",
                      order: 0,
                      alignSelf: "stretch",
                      flexGrow: 0,
                    }}
                  >
                    <span
                      style={{
                        height: "16px",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: "12px",
                        lineHeight: "16px",
                        display: "flex",
                        alignItems: "center",
                        color: "#6B7280",
                        flex: "none",
                        order: 0,
                        flexGrow: 0,
                      }}
                      className="dark:text-zinc-400"
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        height: "16px",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 400,
                        fontSize: "12px",
                        lineHeight: "16px",
                        display: "flex",
                        alignItems: "center",
                        color: "#6B7280",
                        flex: "none",
                        order: 1,
                        flexGrow: 0,
                      }}
                      className="dark:text-zinc-400"
                    >
                      {item.value}%
                    </span>
                  </div>

                  {/* Progress Bar Background */}
                  <div
                    style={{
                      width: "184px",
                      height: "8px",
                      background: "#E8F1FF",
                      borderRadius: "9999px",
                      flex: "none",
                      order: 1,
                      alignSelf: "stretch",
                      flexGrow: 0,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    className="dark:bg-zinc-900"
                  >
                    {/* Progress Bar Fill */}
                    <div
                      style={{
                        position: "absolute",
                        left: "0%",
                        width: `${item.value}%`,
                        top: "0px",
                        bottom: "0px",
                        background: "#1A73E8",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Render employees directly under parent for exact Figma sequence gaps */}
      {employees.map((emp, empIdx) => (
        <div
          key={emp.id}
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0px",
            width: "920px",
            height: "60px",
            background: "#FFFFFF",
            borderRadius: "12px",
            flex: "none",
            order: empIdx + 3,
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="dark:bg-zinc-950"
        >
          {/* Avatar & Info Row (Frame 2608774) */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0px",
              gap: "8px",
              height: "44px",
              flex: "none",
              order: 0,
              flexGrow: 0,
            }}
          >
            {/* Avatar Ellipse */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                overflow: "hidden",
                position: "relative",
                flex: "none",
                order: 0,
                flexGrow: 0,
              }}
            >
              <Image
                src={emp.avatar}
                alt={emp.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Text Frame (Frame 2609008) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                padding: "0px",
                width: emp.textWidth,
                height: "44px",
                flex: "none",
                order: 1,
                flexGrow: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "0px",
                  width: emp.textWidth,
                  height: "44px",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#000000",
                    flex: "none",
                    order: 0,
                    flexGrow: 0,
                  }}
                  className="dark:text-white"
                >
                  {emp.name}
                </span>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "#6B7280",
                    flex: "none",
                    order: 1,
                    flexGrow: 0,
                  }}
                  className="dark:text-zinc-400"
                >
                  {emp.role}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {emp.action === "view" ? (
            <button
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 16px",
                gap: "10px",
                width: "100px",
                height: "40px",
                background: "#FFFFFF",
                border: "1px solid #1A73E8",
                borderRadius: "24px",
                flex: "none",
                order: 1,
                flexGrow: 0,
                cursor: "pointer",
              }}
              className="hover:bg-blue-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  textAlign: "center",
                  color: "#1A73E8",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                View Profile
              </span>
            </button>
          ) : (
            <button
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 16px",
                gap: "10px",
                width: "100px",
                height: "40px",
                background: "#1A73E8",
                borderRadius: "24px",
                flex: "none",
                order: 1,
                flexGrow: 0,
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-blue-700 transition-colors"
            >
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  textAlign: "center",
                  color: "#FFFFFF",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                Connect
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
