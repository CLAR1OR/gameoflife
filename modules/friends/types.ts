import { InferSelectModel } from "drizzle-orm";
import {
  friend,
  friendInteraction,
  friendResidence,
  friendTag,
  friendContact,
  friendEvent,
} from "@/lib/db/schema";

export type Friend = InferSelectModel<typeof friend>;
export type FriendInteraction = InferSelectModel<typeof friendInteraction>;
export type FriendResidence = InferSelectModel<typeof friendResidence>;
export type FriendTag = InferSelectModel<typeof friendTag>;
export type FriendContact = InferSelectModel<typeof friendContact>;
export type FriendEvent = InferSelectModel<typeof friendEvent>;

export type FriendCardData = Friend & {
  currentPlace: {
    id: string;
    name: string;
    countryName: string | null;
    countryCode: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  daysSinceContact: number | null;
  daysUntilDue: number | null;
  interactionCount: number;
  tags: FriendTag[];
  lastInteractionNote: string | null;
  lastInteractionKind: FriendInteraction["kind"] | null;
};

export type FriendsStats = {
  total: number;
  countries: number;
  overdueCount: number;
  thisYearInteractions: number;
};

export type PersonAttentionItem =
  | {
      kind: "overdue";
      friendId: string;
      name: string;
      nickname: string | null;
      photoUrl: string | null;
      currentPlace: FriendCardData["currentPlace"];
      daysOverdue: number;
      sortKey: number;
    }
  | {
      kind: "birthday";
      friendId: string;
      name: string;
      nickname: string | null;
      photoUrl: string | null;
      label: string;
      daysUntil: number;
      turningAge: number | null;
      sortKey: number;
    };

export type UpcomingBirthday = {
  friendId: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  label: string;
  daysUntil: number;
  turningAge: number | null;
};
