import { useLocation } from 'react-router-dom'
import './App.css'
import ScrollToTop from './ScrollToTop'
import AppRoutes from './routes/AppRoutes'
function App() {
  const location = useLocation()

  return (
    <div className="route-transition" key={`${location.pathname}${location.search}`}>
      <ScrollToTop />
      <AppRoutes location={location} />
    </div>
  )
}

export default App
