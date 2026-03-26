import { Outlet } from 'react-router-dom'
import Header from '../../components/layouts/client/header'

export default function HeaderLayout() {
  return (
    <div>
      <Header />
      <div className="client-layout-content">
        <Outlet />
      </div>
    </div>
  )
}
