import {App, Plugin_2, PluginSettingTab, Setting} from "obsidian";
import {RecentlyModifiedNotesPluginInterface} from "./common";

export class RecentlyModifiedNotesSettingTab extends PluginSettingTab {
    private readonly plugin: RecentlyModifiedNotesPluginInterface;

    constructor(app: App, plugin: RecentlyModifiedNotesPluginInterface) {
        super(app, plugin as unknown as Plugin_2);  // To avoid circular dependency on the actual plugin type
        this.plugin = plugin;
    }

    public display(): void {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Recently Modified Notes List plugin' });

        new Setting(containerEl)
            .setName('Enable auto refresh')
            .setDesc('The list of recently modified notes will be refreshed automatically upon each note change.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoRefreshEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.autoRefreshEnabled = value;
                    if (value) {
                        this.plugin.refreshRecentlyModifiedListFromDv()
                        this.plugin.redrawView();
                    }
                    await this.plugin.saveSettings();
                }));
    }
}