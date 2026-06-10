import { ClipLoader } from 'react-spinners'

export function Spinner({ size = 20, color = '#3b82f6' }) {
  return (
    <span className="inline-flex items-center justify-center">
      <ClipLoader size={size} color={color} speedMultiplier={0.9} />
    </span>
  )
}
