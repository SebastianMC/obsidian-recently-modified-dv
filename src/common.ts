export interface ModifiedNote {
    path: string;
    name: string;
}

export interface RecentlyModifiedNotes {
    recentlyModifiedNotes: ModifiedNote[] | undefined
    isUpToDate: boolean
}

export interface RecentlyModifiedNotesPluginSettings {
    autoRefreshEnabled: boolean
}

export interface RecentlyModifiedNotesPluginInterface {
    settings: RecentlyModifiedNotesPluginSettings
    isDvAvailable(): boolean
    refreshRecentlyModifiedListFromDv(): void
    redrawView(): void
    saveSettings(): void
    isAutoDataRefreshEnabled(): boolean
    getRecentlyModifiedNotesData(): RecentlyModifiedNotes
}