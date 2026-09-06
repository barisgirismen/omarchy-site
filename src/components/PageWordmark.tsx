import { OmarchyWordmark, WORDMARK_BANDS } from '@/components/Brand'

export function PageWordmark() {
  return (
    <OmarchyWordmark
      label="Omarchy"
      className="mx-auto mb-3 w-[59.5%] max-w-[26.775rem] text-[color:var(--t-field-lit)]"
      background={WORDMARK_BANDS}
    />
  )
}
