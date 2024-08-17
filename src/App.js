import React, { useEffect, useRef, useState } from 'react';

// SVG Icons
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CoffeeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v12a4 4 0 01-4 4H7a4 4 0 01-4-4V3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17v4" />
  </svg>
);

// Custom Alert component
const Alert = ({ children, variant }) => {
  const bgColor = variant === 'error' ? 'bg-red-100' : 'bg-green-100';
  const borderColor = variant === 'error' ? 'border-red-400' : 'border-green-400';
  const textColor = variant === 'error' ? 'text-red-700' : 'text-green-700';

  return (
    <div className={`border-l-4 p-4 ${bgColor} ${borderColor} ${textColor} rounded-r-lg shadow-md transition-all duration-300 ease-in-out`}>
      {children}
    </div>
  );
};

// Process Step component
const ProcessStep = ({ number, title, description }) => (
  <div className="flex items-start mb-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mr-3">
      {number}
    </div>
    <div>
      <h4 className="text-lg font-semibold mb-1">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function getWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsLoading(false);
          };
          startDetection();
        }
      } catch (err) {
        console.error('Error accessing webcam: ', err);
        alert('Please allow access to the camera and ensure you are using a supported browser.');
        setIsLoading(false);
      }
    }
    getWebcam();
  }, []);

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const drawBoundingBoxes = (eyes) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    eyes.forEach(eye => {
      context.beginPath();
      context.rect(eye.x, eye.y, eye.width, eye.height);
      context.lineWidth = 3;
      context.strokeStyle = '#00ff00';
      context.stroke();
    });
  };

  const startDetection = () => {
    setInterval(async () => {
      try {
        const imageBlob = await captureImage();
        const formData = new FormData();
        formData.append('image', imageBlob);
        const response = await fetch('https://tawfiayeasmin.pythonanywhere.com/detect_drowsiness', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setResult(data.drowsiness_detected ? "Drowsiness Detected" : "No Drowsiness Detected");
        if (data.eyes) drawBoundingBoxes(data.eyes);
        setDetectionCount(prev => prev + 1);
        setLastDetectionTime(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Failed to detect drowsiness:', error);
        setResult('Failed to detect drowsiness. Please try again.');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-200 to-pink-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 animate-pulse">
            Tawfia Road Safety Guardian
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Empowering drivers with cutting-edge AI for real-time drowsiness detection and enhanced road safety.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-600">Live Detection</h2>
              <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="absolute inset-0" />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded-full">
                      <CameraIcon />
                    </div>
                  </>
                )}
              </div>
            </div>
            {result && (
              <Alert variant={result === 'Drowsiness Detected' ? 'error' : 'success'}>
                <div className="flex items-center">
                  {result === 'Drowsiness Detected' ? <AlertIcon /> : <CheckIcon />}
                  <h2 className="text-2xl font-bold ml-2">
                    {result === 'Drowsiness Detected' ? 'Drowsiness Alert!' : 'Stay Alert'}
                  </h2>
                </div>
                <p className="text-lg mt-2">
                  {result === 'Drowsiness Detected' 
                    ? (
                      <span className="flex items-center">
                        Take a break! Consider stopping for a coffee. <CoffeeIcon className="ml-2" />
                      </span>
                    ) 
                    : 'Great job staying alert! Keep up the good work.'}
                </p>
              </Alert>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-600">Detection Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-100 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-semibold">Total Detections</p>
                  <p className="text-3xl font-bold text-purple-800">{detectionCount}</p>
                </div>
                <div className="bg-pink-100 rounded-lg p-4">
                  <p className="text-sm text-pink-600 font-semibold">Last Detection</p>
                  <p className="text-xl font-bold text-pink-800">{lastDetectionTime || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-600">How It Works</h2>
              <ProcessStep 
                number="1" 
                title="Image Capture" 
                description="The system captures frames from your webcam in real-time."
              />
              <ProcessStep 
                number="2" 
                title="Eye Detection" 
                description="Advanced AI algorithms locate and track your eyes in each frame."
              />
              <ProcessStep 
                number="3" 
                title="Drowsiness Analysis" 
                description="The system analyzes eye movement patterns to detect signs of drowsiness."
              />
              <ProcessStep 
                number="4" 
                title="Alert Generation" 
                description="If drowsiness is detected, the system immediately alerts you to take action."
              />
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-600">
          <p>Powered by advanced AI for your safety on the road.</p>
          <p className="mt-2">© 2024 Tawfia Road Safety Guardian. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
