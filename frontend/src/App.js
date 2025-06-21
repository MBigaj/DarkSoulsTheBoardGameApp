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
      <h1>CARDS</h1>
      { cardJson && <img src={`assets/cards/${cardJson[0].imagePath}` } alt='eatmyass' width='250px' /> }
    </div>
  );
}

export default App
