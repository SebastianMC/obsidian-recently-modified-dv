import {EventRef, Events} from "obsidian";

declare module 'obsidian' {
    export class MetadataCacheWithDataview extends Events {
        on(name: 'dataview:index-ready', callback: () => any, ctx?: any): EventRef

        on(name: 'dataview:metadata-change', callback: (type: any, file: any, oldPath?: any) => any, ctx?: any): EventRef
    }
}