import {addIcon} from "obsidian";

export const ICON_CLOCK_AND_PEN: string = 'recently-modidied-notes-icon'

export function addIcons() {
    addIcon(ICON_CLOCK_AND_PEN,
    `<path d="M 28.765338 88.30834 
         C 7.608224 76.58076 -.03592441 49.92245 11.691656 28.7653384
         C 23.419236 7.608224 50.07755 -.03592441 71.23466 11.691656
         C 77.28012 15.042706 82.44665 19.776963 86.31185 25.50735" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" />
    <path d="M 27.517986 72.1223 L 50.112867 49.887133 L 45.503597 29.67626" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="9" fill="none"/>
    <path d="M 87.76221 40.087604 L 98.31476 50.747986 L 91.1663 57.82414 L 80.61375 47.163755 Z" fill="currentColor"/>
    <path d="M 77.01511 50.55255 L 87.56766 61.21293 L 63.936375 84.60518 L 53.38383 73.94479 Z" fill="currentColor"/>
    <path d="M 49.81125 77.65467 L 40.119633 97.71463 L 60.27708 88.22745 Z" fill="currentColor"/>`
    )
}

