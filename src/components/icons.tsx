import type { SVGProps } from 'react'

// ícones desenhados à mão (traço grosso, cantos arredondados) — nada de pacote genérico
const S = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor"
    strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p} />
)
export const IconBox = (p: SVGProps<SVGSVGElement>) => (
  <S {...p}><path d="M3.5 8.2 12 4l8.5 4.2v8.1L12 20.5l-8.5-4.2z" /><path d="M3.5 8.2 12 12.4l8.5-4.2M12 12.4v8" /><path d="m7.6 6.1 8.6 4.3" /></S>
)
export const IconLink = (p: SVGProps<SVGSVGElement>) => (
  <S {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4.2l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" /><path d="M14 10a4.5 4.5 0 0 0-6.4-.2l-2.7 2.7a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" /></S>
)
export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <S {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /><path d="M12 14.5v2.4" /></S>
)
export const IconUnlock = (p: SVGProps<SVGSVGElement>) => (
  <S {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.8a4 4 0 0 1 7.6-1.8" /></S>
)
export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <S {...p}><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h4.5v-5h3v5H18V9.5" /></S>
)
export const IconGear = (p: SVGProps<SVGSVGElement>) => (
  <S {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /></S>
)
export const IconPlus = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M12 5v14M5 12h14" /></S>
export const IconSearch = (p: SVGProps<SVGSVGElement>) => <S {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></S>
export const IconX = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>
export const IconEdit = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></S>
export const IconTrash = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></S>
export const IconCopy = (p: SVGProps<SVGSVGElement>) => <S {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></S>
export const IconEye = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></S>
export const IconEyeOff = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M4 4l16 16" /><path d="M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.3 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4-.9" /></S>
export const IconPin = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M9 4h6l-1 5 3.5 3.5h-11L10 9z" /><path d="M12 12.5V20" /></S>
export const IconOut = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M14 4.5h5.5V10M19.5 4.5 11 13" /><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></S>
export const IconDice = (p: SVGProps<SVGSVGElement>) => <S {...p}><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="9" cy="9" r=".6" fill="currentColor" /><circle cx="15" cy="15" r=".6" fill="currentColor" /><circle cx="15" cy="9" r=".6" fill="currentColor" /><circle cx="9" cy="15" r=".6" fill="currentColor" /></S>
export const IconBack = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M15 5l-7 7 7 7" /></S>
export const IconMove = (p: SVGProps<SVGSVGElement>) => <S {...p}><path d="M5 12h14M14 7l5 5-5 5" /></S>
