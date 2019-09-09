// src/App.js
import React, { useEffect, useReducer, useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import { listCoins } from './graphql/queries'
import { createCoin as CreateCoin } from './graphql/mutations'
import { onCreateCoin } from './graphql/subscriptions'


// import uuid to create a unique client ID
import uuid from 'uuid/v4'

const CLIENT_ID = uuid()

// create initial state
const initialState = {
  name: '', price: '', symbol: '', coins: []
}

// create reducer to update state
function reducer(state, action) {
  switch(action.type) {
    case 'SETCOINS':
      return { ...state, coins: action.coins }
    case 'SETINPUT':
      return { ...state, [action.key]: action.value }
    case 'ADDCOIN':
        return { ...state, coins: [...state.coins, action.coin] }
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [coins, updateCoins] = useState([])

  async function getCoinData() {
    try {
      // const data = await API.get('cryptoapi', '/coins')
      const data = await API.get('cryptoapi', '/coins?limit=5&start=100')
      console.log('data from Lambda REST API: ', data)
      updateCoins(data.coins)
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  useEffect(() => {
    getCoinData()
  }, [])

  useEffect(() => {
    getData()
  }, [])

  // subscribe in useEffect
  useEffect(() => {
    const subscription = API.graphql(graphqlOperation(onCreateCoin)).subscribe({
        next: (eventData) => {
          const coin = eventData.value.data.onCreateCoin
          if (coin.clientId === CLIENT_ID) return
          dispatch({ type: 'ADDCOIN', coin  })
        }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function getData() {
    try {
      const coinData = await API.graphql(graphqlOperation(listCoins))
      console.log('data from API: ', coinData)
      dispatch({ type: 'SETCOINS', coins: coinData.data.listCoins.items})
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  async function createCoin() {
    const { name, price, symbol } = state
    if (name === '' || price === '' || symbol === '') return
    const coin = {
      name, price: parseFloat(price), symbol, clientId: CLIENT_ID
    }
    const coins = [...state.coins, coin]
    dispatch({ type: 'SETCOINS', coins })
    console.log('coin:', coin)
    
    try {
      await API.graphql(graphqlOperation(CreateCoin, { input: coin }))
      console.log('item created!')
    } catch (err) {
      console.log('error creating coin...', err)
    }
  }

  // change state then user types into input
  function onChange(e) {
    dispatch({ type: 'SETINPUT', key: e.target.name, value: e.target.value })
  }

  // add UI with event handlers to manage user input
  return (
    <div>
      <input
        name='name'
        placeholder='name'
        onChange={onChange}
        value={state.name}
      />
      <input
        name='price'
        placeholder='price'
        onChange={onChange}
        value={state.price}
      />
      <input
        name='symbol'
        placeholder='symbol'
        onChange={onChange}
        value={state.symbol}
      />
      <button onClick={createCoin}>Create Coin</button>
      {
        state.coins.map((c, i) => (
          <div key={i}>
            <h2>{c.name}</h2>
            <h4>{c.symbol}</h4>
            <p>{c.price}</p>
          </div>
        ))
      }
      <hr />
      <div>
        {
          coins.map((c, i) => (
            <div key={i}>
              <h2>{c.name}</h2>
              <p>{c.price_usd}</p>
            </div>
          ))
        }
      </div>
    </div>
    
  )
}

export default withAuthenticator(App, { includeGreetings: true })
