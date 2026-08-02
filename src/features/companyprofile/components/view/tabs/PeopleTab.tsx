"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { Search } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";
import { useDebounce } from "@/hooks/use-debounce";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { sendConnectionRequest } from "@/services/api/connections";
import { companyService } from "@/services/organization.service";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface PeopleTabProps {
  data: CompanyProfileData;
}

export default function PeopleTab({ data }: PeopleTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isEdu = data.entityType === "INSTITUTION";
  const { activeProfile } = useActiveProfile();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const { data: peopleData, isLoading } = useQuery({
    queryKey: ["orgPeople", data.id, debouncedSearch, isEdu],
    queryFn: () => 
      isEdu 
        ? companyProfileService.getOrgAlumni(data.id, { page: 1, limit: 20, search: debouncedSearch })
        : companyProfileService.getOrgPeople(data.id, { page: 1, limit: 20, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });


  let distributions: any[] = [];
  if (peopleData?.insights) {
    const mapItems = (arr: any[]) => (arr || []).map((item: any) => ({ label: item.name, value: item.percentage }));
    distributions = [
      { title: "Location Distribution", items: mapItems(peopleData.insights.locationDistribution) },
      { title: "Top Skills", items: mapItems(peopleData.insights.topSkills) },
      { title: "Role Distribution", items: mapItems(peopleData.insights.roleDistribution) },
      isEdu
        ? { title: "Current Employer", items: mapItems(peopleData.insights.currentEmployerBreakdown) }
        : { title: "Education Breakdown", items: mapItems(peopleData.insights.educationBreakdown) },
    ].filter((dist) => dist.items.length > 0);
  }

  const currentUserIdStr = String(session?.user?.id || (session?.user as any)?.user_id || (session?.user as any)?.sub || activeProfile?.id || "").toLowerCase();

  const employeesList = (peopleData?.people || peopleData?.alumni || []).map((emp: any) => {
    let action = "connect";
    const empId = String(emp.user_id || emp.id || emp._id || "").toLowerCase();

    if (empId && currentUserIdStr && empId === currentUserIdStr) {
      action = "empty"; // Hide button for oneself
    } else if (activeProfile?.type === "COMPANY") {
      action = "message"; // Show message button for all other users when logged in as company
    } else if (emp.connection_request_status === "connected") {
      action = "view";
    } else if (emp.connection_request_status === "pending") {
      if (emp.connection_request_sender === "me") {
        action = "pending";
      } else {
        action = "empty";
      }
    }

    return {
      id: empId,
      name: emp.full_name || emp.name || "Unknown",
      role: emp.headline || emp.role_display || emp.title || emp.role || "Associate",
      avatar: emp.avatar_url || emp.avatar || emp.profile_image || "/images/companyonboarding/companyprofileDefault.jpg",
      account_name: emp.account_name || emp.id,
      action,
      textWidth: "125px",
      is_connected: !!emp.is_connected,
    };
  });

  const isCompanyViewer = activeProfile?.type === "COMPANY";
  let you: any[] = [];
  let peopleYouKnow: any[] = [];
  let suggestedPeople: any[] = [];

  if (isCompanyViewer) {
    suggestedPeople = employeesList;
  } else {
    you = employeesList.filter((e: any) => e.id === currentUserIdStr);
    peopleYouKnow = employeesList.filter((e: any) => e.is_connected && e.id !== currentUserIdStr);
    suggestedPeople = employeesList.filter((e: any) => !e.is_connected && e.id !== currentUserIdStr);
  }

  const showGroupHeaders = !isCompanyViewer && peopleYouKnow.length > 0 && suggestedPeople.length > 0;

  // Flex "order" values must stay monotonically increasing after the distributions
  // block (order: 2) for the two groups to render in the right visual sequence.
  let orderCursor = 3;
  const youRows = you.map((emp: any) => ({ emp, order: orderCursor++ }));
  
  const peopleYouKnowHeaderOrder = showGroupHeaders ? orderCursor++ : null;
  const peopleYouKnowRows = peopleYouKnow.map((emp: any) => ({ emp, order: orderCursor++ }));
  
  const suggestedPeopleHeaderOrder = showGroupHeaders ? orderCursor++ : null;
  const suggestedPeopleRows = suggestedPeople.map((emp: any) => ({ emp, order: orderCursor++ }));

  const groupHeaderStyle: React.CSSProperties = {
    width: "920px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    lineHeight: "24px",
    flex: "none",
    alignSelf: "stretch",
  };

  const handleConnect = async (userId: string) => {
    try {
      setConnectingId(userId);
      // Always use user-to-user connection (not company connection)
      // because on the People tab we are connecting with individual employees
      await sendConnectionRequest(userId);
      queryClient.invalidateQueries({ queryKey: ["orgPeople", data.id] });
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnectingId(null);
    }
  };

  const renderEmployeeRow = (emp: any, order: number) => (
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
        borderRadius: "12px",
        flex: "none",
        order,
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="bg-white dark:bg-zinc-950"
    >
      {/* Avatar & Info Row (Frame 2608774) */}
      <Link
        href={`/profile/${emp.account_name}`}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "8px",
          height: "44px",
          flex: "1 1 auto",
          order: 0,
          overflow: "hidden",
          textDecoration: "none",
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
            flex: "1 1 auto",
            overflow: "hidden",
            height: "44px",
            order: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0px",
              width: "100%",
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
                flex: "none",
                order: 0,
                flexGrow: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
              className="text-black dark:text-white"
              title={emp.name}
            >
              {emp.name}
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                flex: "none",
                order: 1,
                flexGrow: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
              className="text-[#6B7280] dark:text-zinc-400"
              title={emp.role}
            >
              {emp.role}
            </span>
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      {emp.action === "view" && (
        <Link
          href={`/profile/${emp.account_name}`}
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
            border: "1px solid #1A73E8",
            borderRadius: "24px",
            flex: "none",
            order: 1,
            flexGrow: 0,
            cursor: "pointer",
            textDecoration: "none",
          }}
          className="bg-white hover:bg-blue-50 dark:bg-transparent dark:hover:bg-zinc-900 transition-colors"
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
        </Link>
      )}

      {emp.action === "pending" && (
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
            border: "1px solid #1A73E8",
            borderRadius: "24px",
            flex: "none",
            order: 1,
            flexGrow: 0,
            cursor: "default",
          }}
          className="bg-white dark:bg-transparent opacity-70"
          disabled
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
            Pending
          </span>
        </button>
      )}

      {emp.action === "connect" && (
        <button
          onClick={() => handleConnect(emp.id)}
          disabled={connectingId === emp.id}
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
            {connectingId === emp.id ? "..." : "Connect"}
          </span>
        </button>
      )}

      {emp.action === "empty" && (
        <div style={{ width: "100px" }} />
      )}

      {emp.action === "message" && (
        <Link
          href={`/messaging?userId=${emp.id}`}
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
            cursor: "pointer",
            border: "none",
            textDecoration: "none",
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
            Message
          </span>
        </Link>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-10">
        <span className="text-zinc-500">Loading people...</span>
      </div>
    );
  }

  if (employeesList.length === 0 && !searchQuery) {
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
        borderRadius: "12px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="bg-white dark:bg-zinc-950 font-poppins"
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
            flex: "none",
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="text-black dark:text-white"
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
            flex: "none",
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="text-[#6B7280] dark:text-zinc-400"
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
            placeholder="Search by name or role"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "290px",
              height: "24px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
            className="text-[#6B7280] dark:text-zinc-300"
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
            borderRadius: "24px",
            flex: "none",
            order: 1,
            flexGrow: 0,
          }}
          className="bg-[#EFF4FF] dark:bg-zinc-900"
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
              flex: "none",
              order: 0,
              flexGrow: 0,
            }}
            className="text-[#6B7280] dark:text-zinc-300"
          >
            {isEdu ? `${peopleData?.meta?.total || employeesList.length} Alumni` : `${peopleData?.meta?.total || employeesList.length} Associates`}
          </span>
        </div>
      </div>

      {distributions.length === 0 && employeesList.length === 0 && searchQuery && (
        <div className="w-full text-center py-10 text-zinc-500">
          No matches found for "{searchQuery}"
        </div>
      )}

      {distributions.length > 0 && (
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
          {distributions.map((dist: any, idx: number) => (
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
                border: "1px solid #E8F1FF",
                borderRadius: "24px",
                flex: "none",
                order: idx,
                flexGrow: 1,
              }}
              className="bg-white dark:bg-zinc-950 dark:border-zinc-900"
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
                    flex: "none",
                    order: 0,
                    alignSelf: "stretch",
                    flexGrow: 0,
                  }}
                  className="text-black dark:text-white"
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
                {dist.items.slice(0, 3).map((item: any, itemIdx: number) => (
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
                        alignItems: "center",
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
                          flex: "1 1 auto",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          paddingRight: "8px",
                        }}
                        className="text-[#6B7280] dark:text-zinc-400 block"
                        title={item.label}
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
                          flex: "none",
                          order: 1,
                          flexGrow: 0,
                        }}
                        className="text-[#6B7280] dark:text-zinc-400"
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
      )}

      {/* Grouped: connected people first (backend-sorted), then suggestions */}
      {youRows.map(({ emp, order }: { emp: any; order: number }) => renderEmployeeRow(emp, order))}

      {showGroupHeaders && (
        <h3 style={{ ...groupHeaderStyle, order: peopleYouKnowHeaderOrder as number }} className="text-black dark:text-white">
          People you know
        </h3>
      )}
      {peopleYouKnowRows.map(({ emp, order }: { emp: any; order: number }) => renderEmployeeRow(emp, order))}

      {showGroupHeaders && (
        <h3 style={{ ...groupHeaderStyle, order: suggestedPeopleHeaderOrder as number }} className="text-black dark:text-white">
          Suggested people
        </h3>
      )}
      {suggestedPeopleRows.map(({ emp, order }: { emp: any; order: number }) => renderEmployeeRow(emp, order))}
    </div>
  );
}
