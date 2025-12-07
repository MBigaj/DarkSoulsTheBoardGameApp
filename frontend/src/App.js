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
    <div className='container'>
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Card search"
        />
      </div>
      <div className="row">
        { cardJson && cardJson.map((card) => (
          <div key={card.id} className="col-md-3 mb-4">
            <div className="card h-100">
              <img src={`assets/cards/${card.imagePath}`} alt={card.name} width='250px' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App
