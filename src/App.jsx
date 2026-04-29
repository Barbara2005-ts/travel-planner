import React, { useState, useEffect } from 'react';
import AuthForm from './components/auth/AuthForm';
import Sidebar from './components/common/Sidebar';
import EmptyState from './components/common/EmptyState';
import TripCard from './components/trips/TripCard';
import CreateTripForm from './components/trips/CreateTripForm';
import TripFilters from './components/trips/TripFilters';
import TripDetail from './components/trips/TripDetail';
import AdminPanel from './components/admin/AdminPanel';
import { InviteSendModal, InviteListModal, ContributionModal } from './components/invites/InviteModal';
import { 
  createTrip, deleteTrip, sendInvite, subscribeToInvites, 
  acceptInvite, rejectInvite, getUserTripsIds, subscribeToTrip, 
  addParticipant, isAdmin 
} from './firebase/firebaseApi';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentView, setCurrentView] = useState('trips');
  const [adminStatus, setAdminStatus] = useState(false);
  const [invites, setInvites] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [filters, setFilters] = useState({ search: '', minBudget: '', maxBudget: '' });

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      checkAdminStatus(u.email);
    }
  }, []);

// В App.jsx, в useEffect для загрузки поездок:
useEffect(() => {
  if (!user) return;
  
  const unsubInvites = subscribeToInvites(user.email, setInvites);
  let unsubTrips = null;
  let subscriptions = {};
  
  const loadTrips = async () => {
    const unsubIds = getUserTripsIds(user.email, (tripIds) => {
      // Отписываемся от старых подписок
      Object.values(subscriptions).forEach(unsub => unsub());
      subscriptions = {};
      
      // Подписываемся на каждую поездку
      tripIds.forEach(tripId => {
        subscriptions[tripId] = subscribeToTrip(tripId, (tripData) => {
          if (tripData) {
            setTrips(prev => {
              const exists = prev.find(t => t.id === tripId);
              if (exists) {
                // Обновляем существующую поездку
                return prev.map(t => t.id === tripId ? tripData : t);
              } else {
                // Добавляем новую поездку
                return [...prev, tripData];
              }
            });
          } else {
            // Удаляем поездку, если она больше не существует
            setTrips(prev => prev.filter(t => t.id !== tripId));
          }
        });
      });
    });
    
    return () => {
      unsubIds();
      Object.values(subscriptions).forEach(unsub => unsub());
    };
  };
  
  loadTrips();
  return () => {
    unsubInvites();
    Object.values(subscriptions).forEach(unsub => unsub());
  };
}, [user]);

  const checkAdminStatus = async (email) => {
    const admin = await isAdmin(email);
    setAdminStatus(admin);
  };

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    checkAdminStatus(userData.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setTrips([]);
    setCurrentTrip(null);
  };

const handleCreateTrip = async ({ destination, dates, budget, creatorAmount }) => {
  const tripId = await createTrip(user.email, { 
    destination, 
    dates, 
    budget,
    creatorAmount: creatorAmount || 0 
  });
};

  const handleDeleteTrip = async (tripId, e) => {
    e.stopPropagation();
    if (confirm('Удалить поездку?')) await deleteTrip(user.email, tripId);
  };

  const handleSendInvite = async (email) => {
    await sendInvite(user.email, email, currentTrip.id, currentTrip.destination);
    setShowInviteModal(false);
    alert('Приглашение отправлено');
  };

  const handleAcceptInvite = (invite) => {
    setSelectedInvite(invite);
    setShowContributionModal(true);
  };

  const handleConfirmContribution = async (amount) => {
    await acceptInvite(user.email, selectedInvite.id, selectedInvite.tripId, selectedInvite.from, amount);
    setShowContributionModal(false);
    setShowInvitesModal(false);
    alert('Вы присоединились к поездке');
  };

  const handleRejectInvite = async (inviteId) => {
    await rejectInvite(user.email, inviteId);
  };

  const filteredTrips = trips.filter(trip => {
    if (filters.search && !trip.destination?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.minBudget && (trip.budget || 0) < Number(filters.minBudget)) return false;
    if (filters.maxBudget && (trip.budget || 0) > Number(filters.maxBudget)) return false;
    return true;
  });

  if (!user) return <AuthForm onLogin={handleLogin} />;

  return (
    <div className="app-container">
      <Sidebar 
        user={user} 
        isAdmin={adminStatus} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout} 
        onShowInvites={() => setShowInvitesModal(true)} 
        invitesCount={invites.length} 
      />
      
      <div className="main-content">
        {currentView === 'trips' && !currentTrip && (
          <>
            <h2>Мои поездки</h2>
            <TripFilters 
              filters={filters} 
              onFilterChange={setFilters} 
              onReset={() => setFilters({ search: '', minBudget: '', maxBudget: '' })} 
              count={filteredTrips.length} 
            />
            <CreateTripForm onCreate={handleCreateTrip} />
            {filteredTrips.length === 0 ? (
              <EmptyState icon="🌍" message={trips.length === 0 ? "Создайте первую поездку!" : "Ничего не найдено"} />
            ) : (
              <div className="trips-grid">
                {filteredTrips.map(trip => (
                  <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    onClick={() => setCurrentTrip(trip)} 
                    onDelete={(e) => handleDeleteTrip(trip.id, e)} 
                    isOwner={trip.createdBy === user.email} 
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {currentView === 'trips' && currentTrip && (
          <TripDetail 
            trip={currentTrip} 
            user={user} 
            onBack={() => setCurrentTrip(null)} 
            onInvite={() => setShowInviteModal(true)} 
          />
        )}
        
        {currentView === 'admin' && adminStatus && <AdminPanel />}
      </div>
      
      {showInviteModal && (
        <InviteSendModal onSend={handleSendInvite} onClose={() => setShowInviteModal(false)} />
      )}
      
      {showInvitesModal && (
        <InviteListModal 
          invites={invites} 
          onAccept={handleAcceptInvite} 
          onReject={handleRejectInvite} 
          onClose={() => setShowInvitesModal(false)} 
        />
      )}
      
      {showContributionModal && selectedInvite && (
        <ContributionModal 
          tripName={selectedInvite.tripName} 
          onConfirm={handleConfirmContribution} 
          onClose={() => setShowContributionModal(false)} 
        />
      )}
    </div>
  );
}

export default App;