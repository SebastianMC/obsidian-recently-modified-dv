import {
  App,
  Events,
  Plugin,
  WorkspaceLeaf,
  MetadataCacheWithDataview, PluginManifest
} from 'obsidian';
import {
  DataviewApi,
  getAPI as getDataviewAPI,
  isPluginEnabled as isDataviewPluginEnabled,
} from "obsidian-dataview"
import {
  RecentlyModifiedNotes,
  RecentlyModifiedNotesPluginSettings,
  RecentlyModifiedNotesPluginInterface, ModifiedNote
} from "./common";
import {
  RecentlyModifiedListView,
  RecentlyModifiedListViewType
} from "./recently-modified-view";
import {addIcons} from "./icons";
import {
  RecentlyModifiedNotesSettingTab
} from "./recently-modified-settings"

export const DEFAULT_DATA: RecentlyModifiedNotes = {
  recentlyModifiedNotes: [],
  isUpToDate: false
};

export const DEFAULT_SETTINGS: RecentlyModifiedNotesPluginSettings = {
  autoRefreshEnabled: true
}

export default class RecentlyModifiedNotesPlugin extends Plugin implements RecentlyModifiedNotesPluginInterface {
  public settings: RecentlyModifiedNotesPluginSettings

  public view: RecentlyModifiedListView
  public dvApi: DataviewApi | undefined
  public dvIndexReady: boolean

  constructor(app: App, manifest: PluginManifest, public data: RecentlyModifiedNotes = DEFAULT_DATA) {
    super(app, manifest);
  }

  public async onload(): Promise<void> {
    console.log(`Loading ${this.manifest.id}`)

    await this.loadSettings()

    addIcons()

    this.data = DEFAULT_DATA

    this.registerView(
      RecentlyModifiedListViewType,
      (leaf) => (this.view = new RecentlyModifiedListView(leaf, this, this.data)),
    );

    this.addCommand({
      id: 'recently-modified-open-view',
      name: 'Open recently modified list view',
      callback: async () => {
        let [leaf] = this.app.workspace.getLeavesOfType(RecentlyModifiedListViewType);
        if (!leaf) {
          leaf = this.app.workspace.getLeftLeaf(false);
          await leaf.setViewState({ type: RecentlyModifiedListViewType });
        }

        this.app.workspace.revealLeaf(leaf);
      }
    });

    this.app.workspace.onLayoutReady(() => {
      this.initView()
    })

    // Dataview integration
    this.dvApi = getDataviewAPI(this.app)
    if (this.dvApi && isDataviewPluginEnabled(this.app)) {
      const mCache: MetadataCacheWithDataview = (this.app.metadataCache as Events as MetadataCacheWithDataview)
      this.registerEvent(mCache.on("dataview:index-ready", () => {
        this.data.isUpToDate = false
        console.log(`DV notified - index ready`)
      }))
      this.registerEvent(mCache.on("dataview:metadata-change", (type, file, oldPath?) => {
        this.data.isUpToDate = false
        console.log(`DV notified - metadata-change (also deletion, rename)`)
      }));
    } else {
      console.log(`DV is not installed or not enabled!`)
    }

    if (this.dvApi?.index?.initialized) {
      console.log(`DV index is already initialized at plugin load time (the index-ready should not be received)`)
    } else {
      console.log(`DV index is NOT initialized at plugin load time (the index-ready SHOULD BE received)`)
    }

    this.addSettingTab(new RecentlyModifiedNotesSettingTab(this.app, this));
  }

  public onunload(): void {
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshRecentlyModifiedListFromDv() {
    if (this.dvApi && isDataviewPluginEnabled(this.app)) {
      const list = this.dvApi
          ?.pages('-#ignore-in-recent')
          .sort((b => b.file.mtime), 'desc')
          .limit(30)
          .map(b => ({path: b.file.path, name: b.file.name} as ModifiedNote))
          .array()
      console.log(list)
      this.data.recentlyModifiedNotes = list
      this.data.isUpToDate = true
    }
  }

  redrawView(): void {
    this.view?.redraw()
  }

  isAutoDataRefreshEnabled(): boolean {
    return this.settings.autoRefreshEnabled
  }

  getRecentlyModifiedNotesData(): RecentlyModifiedNotes {
    return this.data
  }

  isDvAvailable(): boolean {
    return (!!this.dvApi) && isDataviewPluginEnabled(this.app)
  }

  private readonly initView = async (): Promise<void> => {
    let leaf: WorkspaceLeaf | null = null;
    for (leaf of this.app.workspace.getLeavesOfType(RecentlyModifiedListViewType)) {
      if (leaf.view instanceof RecentlyModifiedListView) return;
      // The view instance was created by an older version of the plugin,
      // so clear it and recreate it (so it'll be the new version).
      // This avoids the need to reload Obsidian to update the plugin.
      await leaf.setViewState({ type: 'empty' });
      break;
    }
    (leaf ?? this.app.workspace.getLeftLeaf(false)).setViewState({
      type: RecentlyModifiedListViewType,
      active: true
    });
  };
}


