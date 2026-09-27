import { CheckCircle2 } from 'lucide-react'

export default function DeliveryOption({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${checked ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 bg-white hover:border-amber-300'}`}
    >
      <span className={`h-9 w-9 rounded-lg grid place-items-center ${checked ? 'bg-orange-500 text-white' : 'bg-amber-100 text-orange-600'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className={`text-sm font-semibold leading-tight ${checked ? 'text-orange-900' : 'text-neutral-700'}`}>
        {label}
      </span>
      <span className={`absolute top-2 right-2 h-4 w-4 rounded-full border-2 ${checked ? 'border-orange-500 bg-orange-500' : 'border-neutral-300 bg-white'}`}>
        {checked && <CheckCircle2 className="h-3 w-3 text-white -m-0.5" />}
      </span>
    </button>
  )
}
