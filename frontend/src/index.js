import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import CardPage from './components/pages/CardPage'
import reportWebVitals from './reportWebVitals'
import 'bootstrap/dist/css/bootstrap.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import Navbar from './components/pages/Navbar'
import HomePage from './components/pages/HomePage'
import ExpansionsPage from './components/pages/ExpansionsPage'
import CharactersPage from './components/pages/CharactersPage'
import CampaignsPage from './components/pages/CampaignsPage'
import { BASE_ROUTES } from 'constants'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Base Navbar Pages */}
        <Route path={ BASE_ROUTES.HOMEPAGE } element={ <HomePage /> } />
        <Route path={ BASE_ROUTES.CARDS } element={ <CardPage /> } />
        <Route path={ BASE_ROUTES.EXPANSIONS } element={ <ExpansionsPage /> } />
        <Route path={ BASE_ROUTES.CHARACTERS } element={ <CharactersPage /> } />
        <Route path={ BASE_ROUTES.CAMPAIGNS } element={ <CampaignsPage /> } />
        {/* All routes default here */}
        <Route path="*" element={ <Navigate to={ BASE_ROUTES.HOMEPAGE } /> } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
