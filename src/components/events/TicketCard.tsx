import React from 'react';

export default function TicketCard({ ticket }: { ticket: any }) {
  if (!ticket) return null;

  return (
    <div
      id="ticket"
      style={{
        background: "#1f2937",
        color: "#ffffff",
        borderColor: "#374151"
      }}
      className="w-full sm:w-[380px] rounded-2xl overflow-hidden border mx-auto font-sans"
    >
      {/* Banner */}
      <div
        style={{ background: "#4f46e5" }}
        className="h-28 flex items-center justify-center text-center px-4"
      >
        <h1 className="text-xl font-bold" style={{ lineHeight: '1.5' }}>{ticket.eventName}</h1>
      </div>

      {/* User Info */}
      <div style={{ borderColor: "#374151" }} className="p-4 border-b">
        <p className="font-medium text-lg">👤 {ticket.name}</p>
        <p style={{ color: "#9ca3af" }} className="text-sm mt-1">📧 {ticket.email}</p>
        <p style={{ color: "#9ca3af" }} className="text-sm">📱 {ticket.mobile}</p>
      </div>

      {/* Ticket + QR */}
      <div style={{ borderColor: "#374151" }} className="p-5 border-b flex flex-col items-center relative">

        <p className="text-[15px] font-semibold mb-4 text-white flex items-center gap-2 tracking-wide">
          👉 Scan for Entry
        </p>

        <div className="relative group">
          {/* Animated Pulse Glow */}
          <div
            className="absolute -inset-1 rounded-[16px] opacity-60 animate-pulse"
            style={{
              background: "linear-gradient(90deg, #4f46e5, #9333ea, #4f46e5)",
              filter: "blur(6px)",
              animationDuration: "2.5s"
            }}
          ></div>

          {/* QR Container */}
          <div
            className="relative bg-white p-3 rounded-xl"
            style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }}
          >
            <img
              src={ticket.qrCode}
              alt="Ticket QR Code"
              style={{ width: "135px", height: "135px" }}
              className="block"
            />
          </div>
        </div>

        {/* Explicit Event Name under QR */}
        <p className="text-primary font-bold text-sm mt-3 px-3 py-1 bg-primary/10 rounded-full">
          Valid for: {ticket.eventName}
        </p>

        <p style={{ color: "#9ca3af" }} className="text-xs mt-5 font-mono tracking-widest uppercase">
          Ticket ID: {ticket.ticketId}
        </p>
      </div>

      {/* Event Details */}
      <div style={{ borderColor: "#374151" }} className="p-4 border-b text-sm space-y-2">
        <p className="flex items-center gap-2">🗓️ <span>{ticket.date}</span></p>
        <p className="flex items-center gap-2">⏰ <span>{ticket.time}</span></p>
        <p className="flex gap-2">📍 <span style={{ flex: 1, wordBreak: 'break-word', lineHeight: '1.5' }}>{ticket.location}</span></p>
      </div>

      {/* Organizer Info */}
      <div style={{ borderColor: "#374151" }} className="p-4 border-b text-sm">
        <p>🏢 Organized by: <span className="font-semibold">{ticket.organizerName || 'SATYA'}</span></p>
        {ticket.organizerEmail && (
          <p style={{ color: "#9ca3af" }} className="text-xs mt-1 font-mono">
            📧 Contact: {ticket.organizerEmail}
          </p>
        )}
      </div>

      {/* Instructions */}
      <div style={{ borderColor: "#374151", color: "#9ca3af" }} className="p-4 border-b text-xs space-y-1">
        <p>⚠️ Bring valid ID proof</p>
        <p>⚠️ Reach 30 mins before the event starts</p>
        <p>⚠️ Show this QR code at the entry gate</p>
      </div>

      {/* Footer */}
      <div style={{ color: "#6b7280" }} className="p-4 text-center text-xs uppercase tracking-widest font-semibold">
        Enjoy the Event
      </div>
    </div>
  );
}
