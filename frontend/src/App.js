import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [cardJson, setCardJson] = useState(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/', {
      method: 'GET',
    })
      .then(response => response.json())
      .then((data) => {
        setCardJson(data)
        console.log(data)
      })
  }, [])

  return (
    <div className="App">
      { cardJson && <img src={`assets/cards/${cardJson.imagePath}`} /> }
    </div>
  );
}

export default App
