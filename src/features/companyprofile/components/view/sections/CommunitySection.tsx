"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";

interface CommunitySectionProps {
  data: CompanyProfileData;
}

export default function CommunitySection({ data }: CommunitySectionProps) {
  const [subscribed, setSubscribed] = useState(false);

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
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        <h2
          style={{
            width: "147px",
            height: "32px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "32px",
            display: "flex",
            alignItems: "center",
            color: "#000000",
            flex: "none",
            flexGrow: 0,
          }}
          className="dark:text-white"
        >
          Community
        </h2>
      </div>

      {/* Frame 2609101: Content row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "100px",
          flex: "none",
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        {/* Subtract: Banner Image */}
        <div
          style={{
            width: "178px",
            height: "100px",
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            flex: "none",
            flexGrow: 0,
          }}
        >
          <Image
            src="/images/companyonboarding/companycoverphotoDefault.png"
            alt="Newsletter Cover"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Frame 2609102: Details Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "8px",
            width: "726px",
            height: "100px",
            flex: "none",
            flexGrow: 1,
          }}
        >
          {/* Frame 2609103: Text Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0px",
              gap: "4px",
              width: "187px",
              height: "52px",
              flex: "none",
              flexGrow: 0,
            }}
          >
            <span
              style={{
                width: "187px",
                height: "24px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "24px",
                display: "flex",
                alignItems: "center",
                color: "#000000",
                flex: "none",
                flexGrow: 0,
              }}
              className="dark:text-white"
            >
              {data.name}
            </span>
            <span
              style={{
                width: "90px",
                height: "24px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "24px",
                display: "flex",
                alignItems: "center",
                color: "#6B7280",
                flex: "none",
                flexGrow: 0,
              }}
              className="dark:text-zinc-400"
            >
              {data.stats.subscribers} Subscriber
            </span>
          </div>

          {/* Frame 2608519: Subscribe Button */}
          <button
            onClick={() => setSubscribed((s) => !s)}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: "8px 16px",
              gap: "10px",
              width: "142px",
              height: "40px",
              background: subscribed ? "#EFF4FF" : "#FFFFFF",
              border: "1px solid #1A73E8",
              borderRadius: "24px",
              flex: "none",
              flexGrow: 0,
              cursor: "pointer",
            }}
            className="hover:bg-blue-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <span
              style={{
                width: "70px",
                height: "20px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                textAlign: "center",
                color: "#1A73E8",
                flex: "none",
                flexGrow: 0,
              }}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
