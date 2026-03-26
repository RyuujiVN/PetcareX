import { Outlet } from 'react-router-dom'
import Header from '../../components/layouts/client/header'

export default function HeaderLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}
