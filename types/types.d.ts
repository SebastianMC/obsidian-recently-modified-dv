import {EventRef, Events, WorkspaceLeaf} from "obsidian";

// Types to satisfy TypeScript strict type checking and avoid constructs like 'as any' or 'as unknown', etc.

declare module 'obsidian' {
    export class MetadataCacheWithDataview extends Events {
        on(name: 'dataview:index-ready', callback: () => any, ctx?: any): EventRef

        on(name: 'dataview:metadata-change', callback: (type: any, file: any, oldPath?: any) => any, ctx?: any): EventRef
    }

    export class WorkspaceInternal {
        createLeafInTabGroup(): WorkspaceLeaf  // Unclear why Obsidian team didn't expose this. Maybe in 1.x.x they will???
    }
}
