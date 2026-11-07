import { PlugZap } from 'lucide-react'
import { useI18n } from '@/i18n'

/** A faint plug on a dark screen: it has no power. */
export function NoPower() {
  const { t } = useI18n()
  return (
    <span className="screen-nopower" role="img" aria-label={t.display.noPower}>
      <PlugZap aria-hidden />
    </span>
  )
}
