import type { GroupColor } from '@/lib/messaging';

/** A browser tab group as shown in the popup. */
export type PopupGroup = { id: number; title: string; color: GroupColor; windowId: number };
