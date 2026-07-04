"use client";

import React from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";

interface PeopleSectionProps {
  data: CompanyProfileData;
}

export default function PeopleSection({ data }: PeopleSectionProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0px",
        gap: "16px",
        width: "960px",
        height: "192px",
        background: "#FFFFFF",
        borderRadius: "24px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="dark:bg-zinc-950 dark:border dark:border-zinc-900"
    >
      {/* Frame 2609076: Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "32px",
          flex: "none",
          order: 0,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        {/* People Title */}
        <h2
          style={{
            width: "83px",
            height: "32px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "32px",
            display: "flex",
            alignItems: "center",
            color: "#000000",
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          className="dark:text-white"
        >
          People
        </h2>
      </div>

      {/* Frame 2609092: Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "76px",
          flex: "none",
          order: 1,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        {/* 1 Connections */}
        <span
          style={{
            height: "16px",
            fontFamily: "'Poppins', sans-serif",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "16px",
            color: "#000000",
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          className="dark:text-zinc-300"
        >
          1 Connections
        </span>

        {/* Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0px",
            gap: "16px",
            width: "920px",
            height: "44px",
            flex: "none",
            order: 1,
            alignSelf: "stretch",
            flexGrow: 0,
          }}
        >
          {/* Frame 2608774 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0px",
              gap: "8px",
              width: "327px",
              height: "44px",
              flex: "none",
              order: 0,
              flexGrow: 0,
            }}
          >
            {/* Ellipse 2: Avatar */}
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
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                alt="Alex Rivera"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Frame 2609008 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                padding: "0px",
                gap: "8px",
                width: "279px",
                height: "44px",
                flex: "none",
                order: 1,
                flexGrow: 0,
              }}
            >
              {/* Frame 2609009 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "0px",
                  width: "279px",
                  height: "44px",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                {/* Name: Alex Rivera */}
                <span
                  style={{
                    height: "24px",
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
                  Alex Rivera
                </span>

                {/* Subtitle: Principal Architect at Quantum Systems */}
                <span
                  style={{
                    height: "20px",
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
                  Principal Architect at Quantum Systems
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frame 2609084: View More Button */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px 0px",
          gap: "10px",
          width: "86px",
          height: "52px",
          flex: "none",
          order: 2,
          flexGrow: 0,
        }}
      >
        <button
          style={{
            width: "86px",
            height: "20px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "20px",
            textAlign: "center",
            color: "#6B7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          className="hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
        >
          View more
        </button>
      </div>
    </div>
  );
}
