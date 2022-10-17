import {addIcon} from "obsidian";

export const ICON_CLOCK_AND_PEN: string = 'recently-modidied-notes-icon'

export function addIcons() {
    addIcon(ICON_CLOCK_AND_PEN,
    `<circle cx="50" cy="50" r="43.8000713858342" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="9"/>
        <path d="M 50 50 L 50.703125 50 L 41.772727 22.636364" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="9"/>
        <path d="M 62.10939 35.6 L 67.82793 42.549697 L 62.50919 46.926206 L 56.79065 39.97651 Z" fill="currentColor"/>
        <path d="M 54.42812 41.9229 L 60.14666 48.872596 L 37.250434 67.7127 L 31.531892 60.76301 Z" fill="currentColor"/>
        <path d="M 29.16945 62.7095 L 24.2617 72.57542 L 34.88799 69.6592 Z" fill="currentColor"/>`
    )
}

