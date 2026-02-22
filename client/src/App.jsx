import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ModalProvider } from './contexts/ModalContext';
import Modal from './components/ui/Modal';
import MainPage from './pages/MainPage';
import FeedbackPage from './pages/FeedbackPage';
import CreateClassVote from './pages/CreateClassVote';
import CreateSchoolVote from './pages/CreateSchoolVote';
import AdminPage from './pages/AdminPage';
import VotePage from './pages/VotePage';
import ResultPage from './pages/ResultPage';
import UsagePage from './pages/UsagePage';
import './App.css';

function App() {
  return (
    <ModalProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/create/class" element={<CreateClassVote />} />
          <Route path="/create/school" element={<CreateSchoolVote />} />
          <Route path="/admin/:roomId" element={<AdminPage />} />
          <Route path="/vote/:roomId" element={<VotePage />} />
          <Route path="/result/:roomId" element={<ResultPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/usage" element={<UsagePage />} />
          {/* Add more routes here later */}
        </Routes>
      </Layout>
      <Modal />
    </ModalProvider>
  );
}

export default App;
