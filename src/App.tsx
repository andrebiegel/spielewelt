import './App.css'
import Navbar from './components/Navbar'
import GameCanvas from './components/GameCanvas'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <GameCanvas />
      </main>
    </div>
  )
}

export default App
