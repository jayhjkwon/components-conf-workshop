import React, { useEffect, useState } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import { Auth, API, graphqlOperation } from 'aws-amplify'
import { listCoins } from './graphql/queries'

function App() {
  const [coins, updateCoins] = useState([])
  
  useEffect(() => {
    getData()
  }, [])

  async function getData() {
    try {
      const coinData = await API.graphql(graphqlOperation(listCoins))
      console.log('data from API: ', coinData)
      updateCoins(coinData.data.listCoins.items)
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(user => console.log({ user }))
      .catch(error => console.log({ error }))
  })
    
  return (
    <div className="App">
      <div>
        {
          coins.map((c, i) => (
            <div key={i}>
              <h2>{c.name}</h2>
              <h4>{c.symbol}</h4>
              <p>{c.price}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true })
