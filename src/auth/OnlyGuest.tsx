import { Navigate } from "react-router-dom"
import { useAuth } from "./useAuth"

export default function OnlyGuest({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth()
  if (loading) return null
  if (me?.email) return <Navigate to="/" replace />
  return <>{children}</>
}
