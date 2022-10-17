import {Plugin} from "obsidian";

export interface ModifiedNote {
    path: string;
    name: string;
}

export  interface RecentlyModifiedNotes {
    recentlyModifiedNotes: ModifiedNote[] | undefined
    isUpToDate: boolean
}

export interface RecentlyModifiedNotesPluginSettings {
    autoRefreshEnabled: boolean
}

export interface RecentlyModifiedNotesPluginInterface {
    settings: RecentlyModifiedNotesPluginSettings
    refreshRecentlyModifiedListFromDv(): void
    redrawView(): void
    saveSettings(): void
}