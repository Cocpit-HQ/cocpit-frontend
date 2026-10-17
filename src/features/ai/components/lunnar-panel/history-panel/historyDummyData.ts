export interface HistoryItemType {
  id: string;
  title: string;
  isPinned: boolean;
}

export const initialHistoryData: HistoryItemType[] = [
  {
    id: "1",
    title: "App discussion",
    isPinned: true,
  },
  {
    id: "2",
    title: "Greetings",
    isPinned: false,
  },
  {
    id: "3",
    title: "Business Ideas",
    isPinned: false,
  },
  {
    id: "4",
    title: "Frontend Roadmap",
    isPinned: false,
  },
  {
    id: "5",
    title: "Marketing Strategy",
    isPinned: false,
  },
];
