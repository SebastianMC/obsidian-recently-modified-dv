import {ItemView, Menu, Notice, WorkspaceLeaf, WorkspaceInternal, TFile} from "obsidian";
import {ICON_CLOCK_AND_PEN} from "./icons";
import {RecentlyModifiedNotesPluginInterface} from "./common";
import {RecentlyModifiedNotes, ModifiedNote} from "./common";

export const RecentlyModifiedListViewType = 'recently-modified-dv';

export class RecentlyModifiedListView extends ItemView {
    private readonly plugin: RecentlyModifiedNotesPluginInterface;
    private data: RecentlyModifiedNotes;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: RecentlyModifiedNotesPluginInterface,
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
        return ICON_CLOCK_AND_PEN
    }

    public onPaneMenu(menu: Menu): void {
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
        console.log(`DV redraw invoked on view`)

        const rootEl = createDiv({ cls: 'nav-folder mod-root' })
        const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' })

        if (!this.plugin.isDvAvailable()) {
            // Dataview is not available, render a stubbed out row with status information
            const navFile = childrenEl.createDiv({ cls: 'nav-file' })
            const navFileTitle = navFile.createDiv({ cls: 'nav-file-title' })
            navFileTitle.createDiv({
                cls: 'nav-file-title-content',
                text: 'Dataview plugin not available or not enabled.'
            })
            const contentEl = this.containerEl.children[1];
            contentEl.empty();
            contentEl.appendChild(rootEl);
            return
        }

        // At this point we know Dataview is available, can interact
        if (!this.plugin.getRecentlyModifiedNotesData().isUpToDate) {
            if (this.plugin.getRecentlyModifiedNotesData().recentlyModifiedNotes?.length === 0 || this.plugin.isAutoDataRefreshEnabled()) {
                console.log(`DV Recent redraw: no data ${this.plugin.getRecentlyModifiedNotesData().recentlyModifiedNotes?.length} or not up to date -> REFRESHING from dv`)
                this.plugin.refreshRecentlyModifiedListFromDv()
            } else {
                console.log(`DV Recent redraw: data not up to date (or empty), NOT refreshing`)
            }
        } else {
            console.log(`DV Recent redraw: data are up to date`)
        }

        const openFile = this.app.workspace.getActiveFile();

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
                const inNewTab: boolean = event.ctrlKey || event.metaKey
                this.openOrFocusNote(currentFile, inNewTab);
            });
        });

        const contentEl = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    };

    /**
     * Open the note in the most recent leaf.
     *
     * New tab (if not specified) is applied automatically if current leaf is pinned
     */
    private readonly openOrFocusNote = (note: ModifiedNote, newTab = false): void => {
        const targetFile = this.app.vault.getAbstractFileByPath(note.path)

        if (targetFile) {
            let leaf: WorkspaceLeaf | null = this.app.workspace.getMostRecentLeaf();

            const createLeaf = newTab || leaf?.getViewState().pinned;
            if (createLeaf && leaf) {
                leaf = (this.app.workspace as unknown as WorkspaceInternal).createLeafInTabGroup()
            }
            leaf?.openFile(targetFile as TFile);
        } else {
            new Notice(`Cannot find note '${note.name}'`);
            this.data.recentlyModifiedNotes = this.data.recentlyModifiedNotes?.filter((note) => note.path !== note.path);
            this.redraw();
        }
    };
}
