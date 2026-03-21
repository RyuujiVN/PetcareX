import { Outlet } from 'react-router-dom'
import Header from '../components/layout/header'
import Footer from '../components/layout/footer'

export default function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
