import { Label } from '@/components/ui/label'

export default function FormField({ icon: Icon, label, children, required }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-orange-500" />}
        {label}{required && <span className="text-orange-500">*</span>}
      </Label>
      {children}
    </div>
  )
}
