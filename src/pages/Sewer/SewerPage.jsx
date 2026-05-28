import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export function SewerPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate(ROUTES.RIVER, { replace: true }) }, [navigate])
  return null
}
