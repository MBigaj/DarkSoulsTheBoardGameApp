import { useEffect, useState } from 'react'

function CardPage() {
  const [cardsJson, setCardsJson] = useState(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/', {
      method: 'GET',
    })
      .then(response => response.json())
      .then((data) => {
        setCardsJson(data)
        console.log(data)
      })
  }, [])

  return (
    <div className='container'>
      <div className="my-4">
        <input
          type="text"
          className="form-control"
          placeholder="Card search"
        />
      </div>
      <div className="row">
        { cardsJson && cardsJson.map((card) => (
          <div key={card.id} className="col-md-3 mb-4">
            <div className="card h-100 w-75">
              <img src={`assets/cards/${card.imagePath}`} alt={card.name} width='200px' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardPage
