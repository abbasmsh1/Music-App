import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface AudioVisualizerProps {
  audioUrl?: string;
}

function AudioAnalyzer({ audioUrl }: AudioVisualizerProps) {
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!audioUrl) return;

    const audioContext = new AudioContext();
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    fetch(audioUrl)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        source.start(0);

        analyzerRef.current = analyzer;
        audioContextRef.current = audioContext;
        dataArrayRef.current = dataArray;
      })
      .catch((error) => console.error('Error loading audio:', error));

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  useFrame(() => {
    if (!analyzerRef.current || !dataArrayRef.current || !meshRef.current) return;

    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    const data = dataArrayRef.current;

    // Update geometry based on audio data
    if (meshRef.current.geometry instanceof THREE.BoxGeometry) {
      const positions = meshRef.current.geometry.attributes.position;
      const count = positions.count;

      for (let i = 0; i < count; i++) {
        const freqIndex = Math.floor((i / count) * data.length);
        const value = data[freqIndex] / 128.0;
        positions.setY(i, value);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[5, 0.1, 5, 32, 32]} />
      <meshStandardMaterial 
        color="#1DB954"
        wireframe
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  );
}

export default function MusicVisualizer({ audioUrl }: AudioVisualizerProps) {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <AudioAnalyzer audioUrl={audioUrl} />
      </Canvas>
    </div>
  );
} 