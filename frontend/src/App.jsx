// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import EditEvent from './pages/EditEvent';
import ClubInfo from './pages/ClubInfo';
import MapPage from './pages/Map';
import CreateAccount from './pages/CreateAccount';
import AddEvent from './pages/AddEvent';
import Profile from './pages/Profile';
import OauthCallback from './pages/OauthCallback.jsx';
import CreateEvent from './pages/CreateEvent';
import SuperAdminPanel from "./pages/SuperAdminPanel";

import Favorites from './pages/Favorites';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/*" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<CreateAccount />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Old route used in dev branch */}
        <Route path="/event/:id" element={<EventDetails />} />
        {/* New route used by updated Dashboard / EventDetails */}
        <Route path="/events/:id" element={<EventDetails />} />
        {/* Create event (admin only via UI + backend) */}
        {/* <Route path="/events/new" element={<CreateEvent />} /> somebody made this, we already have an add event, so ive no clue why. it also just straight up doesnt work right now. */}
        {/* im going to keep it here commented out for now incase we need something from it later */}

        <Route path="/add" element={<AddEvent />} />
        {/* This is the actual component for adding.keep in mind this is seans sole contributon so removing it would remove his work entirely */}

        <Route path="/map" element={<MapPage />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/edit/:id" element={<EditEvent />} />
        <Route path="/clubs/:id" element={<ClubInfo />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/oauth-callback" element={<OauthCallback />} />
        <Route path="/superadmin" element={<SuperAdminPanel />} />


        <Route path="/add" element={<AddEvent />} />
      </Routes>
    </Router>
  );
}

export default App;
