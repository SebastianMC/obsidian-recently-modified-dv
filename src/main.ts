import {
  App,
  Events,
  ItemView,
  Menu,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
  MetadataCacheWithDataview
} from 'obsidian';
import {
  DataviewApi,
  getAPI as getDataviewAPI,
  isPluginEnabled as isDataviewPluginEnabled,
} from "obsidian-dataview"

interface ModifiedNote {
  path: string;
  name: string;
}

interface RecentlyModifiedNotes {
  recentlyModifiedNotes: ModifiedNote[] | undefined
  isUpToDate: boolean
}

const DEFAULT_DATA: RecentlyModifiedNotes = {
  recentlyModifiedNotes: [],
  isUpToDate: false
};

interface RecentlyModifiedNotesPluginSettings {
  autoRefreshEnabled: boolean
}

const DEFAULT_SETTINGS: RecentlyModifiedNotesPluginSettings = {
  autoRefreshEnabled: true
}

const RecentlyModifiedListViewType = 'recently-modified-dv';

class RecentlyModifiedListView extends ItemView {
  private readonly plugin: RecentlyModifiedNotesPlugin;
  private data: RecentlyModifiedNotes;

  constructor(
    leaf: WorkspaceLeaf,
    plugin: RecentlyModifiedNotesPlugin,
    data: RecentlyModifiedNotes,
  ) {
    super(leaf);

    this.plugin = plugin;
    this.data = data;
  }

  public async onOpen(): Promise<void> {
    this.redraw();
  }

  public getViewType(): string {
    return RecentlyModifiedListViewType;
  }

  public getDisplayText(): string {
    return 'Recently modified notes. Click to refresh';
  }

  public getIcon(): string {
    return 'dice';
  }

  public onHeaderMenu(menu: Menu): void {
    menu
      .addItem((item) => {
        item
          .setTitle('Refresh list')
          .onClick(async () => {
            this.plugin.refreshRecentlyModifiedListFromDv()
            this.redraw();
          });
      })
  }

  public load(): void {
    super.load()
  }

  public readonly redraw = (): void => {
    if (!this.plugin.data.isUpToDate) {
      if (this.plugin.data.recentlyModifiedNotes?.length === 0 || this.plugin.settings.autoRefreshEnabled) {
        console.log(`DV Recent redraw: no data ${this.plugin.data.recentlyModifiedNotes?.length} or not up to date -> REFRESHING from dv`)
        this.plugin.refreshRecentlyModifiedListFromDv()
      } else {
        console.log(`DV Recent redraw: data not up to date (or empty), NOT refreshing`)
      }
    } else {
      console.log(`DV Recent redraw: data are up to date`)
    }

    const openFile = this.app.workspace.getActiveFile();

    const rootEl = createDiv({ cls: 'nav-folder mod-root' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    this.data.recentlyModifiedNotes?.forEach((currentFile) => {
      const navFile = childrenEl.createDiv({ cls: 'nav-file' });
      const navFileTitle = navFile.createDiv({ cls: 'nav-file-title' });

      if (openFile && currentFile.path === openFile.path) {
        navFileTitle.addClass('is-active');
      }

      navFileTitle.createDiv({
        cls: 'nav-file-title-content',
        text: currentFile.name,
      });

      navFile.setAttr('draggable', 'true');
      navFile.addEventListener('dragstart', (event: DragEvent) => {
        const file = this.app.metadataCache.getFirstLinkpathDest(
          currentFile.path,
          '',
        );

        const dragManager = (this.app as any).dragManager;
        const dragData = dragManager.dragFile(event, file);
        dragManager.onDragStart(event, dragData);
      });

      navFile.addEventListener('mouseover', (event: MouseEvent) => {
        this.app.workspace.trigger('hover-link', {
          event,
          source: RecentlyModifiedListViewType,
          hoverParent: rootEl,
          targetEl: navFile,
          linktext: currentFile.path,
        });
      });

      navFile.addEventListener('contextmenu', (event: MouseEvent) => {
        const menu = new Menu();
        const file = this.app.vault.getAbstractFileByPath(currentFile.path);
        this.app.workspace.trigger(
          'file-menu',
          menu,
          file,
          'link-context-menu',
        );
        menu.showAtPosition({ x: event.clientX, y: event.clientY });
      });

      navFile.addEventListener('click', (event: MouseEvent) => {
        this.openOrFocusFile(currentFile, event.ctrlKey || event.metaKey);
      });
    });

    const contentEl = this.containerEl.children[1];
    contentEl.empty();
    contentEl.appendChild(rootEl);
  };

  /**
   * Open the provided file in the most recent leaf.
   *
   * @param shouldSplit Whether the file should be opened in a new split, or in
   * the most recent split. If the most recent split is pinned, this is set to
   * true.
   */
  private readonly openOrFocusFile = (note: ModifiedNote, shouldSplit = false): void => {
    // TODO: open file by name instead of calling the heavy .getFiles()
    const targetFile = this.app.vault
      .getFiles()
      .find((f) => f.path === note.path);

    if (targetFile) {
      let leaf: WorkspaceLeaf | null = this.app.workspace.getMostRecentLeaf();

      const createLeaf = shouldSplit || leaf?.getViewState().pinned;
      if (createLeaf && leaf) {
        leaf = this.app.workspace.createLeafBySplit(leaf);
      }
      leaf?.openFile(targetFile);
    } else {
      new Notice(`Cannot find file '${note.name}'`);
      this.data.recentlyModifiedNotes = this.data.recentlyModifiedNotes?.filter((note) => note.path !== note.path);
      this.redraw();
    }
  };
}

export default class RecentlyModifiedNotesPlugin extends Plugin {
  public settings: RecentlyModifiedNotesPluginSettings
  public data: RecentlyModifiedNotes
  public view: RecentlyModifiedListView
  public dvApi: DataviewApi | undefined

  public async onload(): Promise<void> {
    console.log(`Loading ${this.manifest.id}`)

    await this.loadSettings()

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

    (this.app.workspace as any).registerHoverLinkSource(
      RecentlyModifiedListViewType,
      {
        display: 'AAA Recently modified notes',
        defaultMod: true,
      },
    );

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
        console.log(`DV notified - metadata-change - is it triggered for deletion or for plain edit as well???"`)
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
    (this.app.workspace as any).unregisterHoverLinkSource(
      RecentlyModifiedListViewType,
    );
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
      active: true,
    });
  };
}

class RecentlyModifiedNotesSettingTab extends PluginSettingTab {
  private readonly plugin: RecentlyModifiedNotesPlugin;

  constructor(app: App, plugin: RecentlyModifiedNotesPlugin) {
    super(app, plugin);
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
                this.plugin.view?.redraw();
              }
              await this.plugin.saveSettings();
            }));
  }
}
