import React from "react";
import { DisplayNotification, NotificationTab } from "../types";
import { NotificationItem } from "./NotificationItem";
import { NotificationGroup } from "./NotificationGroup";
import { NotificationEmptyState } from "./NotificationEmptyState";

interface NotificationListProps {
  items: DisplayNotification[];
  loading: boolean;
  activeTab: NotificationTab;
  isCleared?: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  items,
  loading,
  activeTab,
  isCleared = false,
  onRead,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-2.5 py-2 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-row items-center justify-between p-3 rounded-lg bg-ds-surface-1/60 border border-ds-border/30"
          >
            <div className="flex flex-row items-center gap-3 flex-1">
              <div className="w-1.5 h-1.5 rounded-full bg-ds-border/50" />
              <div className="w-6 h-6 rounded-full bg-ds-border/60" />
              <div className="h-4 bg-ds-border/50 rounded w-2/3" />
            </div>
            <div className="flex flex-row items-center gap-3">
              <div className="h-3 bg-ds-border/40 rounded w-12" />
              <div className="w-4 h-4 bg-ds-border/40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    if (activeTab === "jobs") {
      return (
        <NotificationEmptyState
          title="No job updates yet"
          description="New job updates will appear here when available"
        />
      );
    }

    if (isCleared) {
      return (
        <NotificationEmptyState
          title="No Notifications"
          description="You’re all caught up for now"
        />
      );
    }

    return (
      <NotificationEmptyState
        title="No Notifications Received"
        description="You’ll see your latest updates and alerts here"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((entry) => {
        if (entry.isGroup) {
          return (
            <NotificationGroup
              key={entry.id}
              notifications={entry.items}
              onRead={onRead}
              onDelete={onDelete}
            />
          );
        }
        return (
          <NotificationItem
            key={entry.id}
            notification={entry.item}
            onRead={onRead}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};
