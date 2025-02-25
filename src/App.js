import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';

// AWS Amplify configuration
// Amplify.configure({
//   Auth: {
//     region: 'us-east-1', // Update with your Cognito region
//     userPoolId: 'us-east-1_XXXXXXXXX', // Update with your User Pool ID
//     userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXX', // Update with your App Client ID
//   },
// });

// Upload Component
const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    setStatus('Requesting upload URL...');
    const res = await axios.post('/upload');
    const { uploadUrl: url } = res.data;
    setUploadUrl(url);

    setStatus('Uploading...');
    await axios.put(url, file, {
      headers: { 'Content-Type': file.type },
    });
    setStatus('Upload successful!');
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Audio</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600"
      >
        Upload
      </button>
      <p className="mt-4 text-gray-700">{status}</p>
    </div>
  );
};

// Audio Player Component
const AudioPlayer = () => {
  const [audioList, setAudioList] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    const fetchAudios = async () => {
      const res = await axios.get('/stream');
      setAudioList(res.data.audios);
    };
    fetchAudios();
  }, []);

  const playAudio = (audioUrl) => {
    if (audio) audio.pause();
    const newAudio = new Audio(audioUrl);
    setAudio(newAudio);
    newAudio.play();
    setCurrentAudio(audioUrl);
    axios.post('/interaction', { eventType: 'play', audioUrl });
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Audio Player</h2>
      <ul>
        {audioList.map((audioItem) => (
          <li key={audioItem.id} className="mb-2">
            <button
              onClick={() => playAudio(audioItem.url)}
              className="text-blue-500 hover:underline"
            >
              {audioItem.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [analytics, setAnalytics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const analyticsRes = await axios.get('/analytics');
      setAnalytics(analyticsRes.data);
      const recRes = await axios.get('/recommendations');
      setRecommendations(recRes.data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <h3 className="text-lg font-semibold">Top Tracks</h3>
      <ul>
        {analytics.map((track) => (
          <li key={track.audioId}>{track.title} - {track.plays} plays</li>
        ))}
      </ul>
      <h3 className="text-lg font-semibold mt-6">Personalized Recommendations</h3>
      <ul>
        {recommendations.map((rec) => (
          <li key={rec.audioId}>{rec.title}</li>
        ))}
      </ul>
    </div>
  );
};

// Main App Component
const App = () => (
  <Router>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Authenticator>
        {({ signOut, user }) => (
          <div className="max-w-4xl w-full space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">Streamlytics</h1>
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-2xl hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/player" element={<AudioPlayer />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        )}
      </Authenticator>
    </div>
  </Router>
);

export default App;
