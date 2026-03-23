import { Outlet } from 'react-router-dom'
import Header from '../../components/layouts/client/header'
import Footer from '../../components/layouts/client/footer'

export default function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
