import React, { useState, useEffect, useRef, startTransition } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import ThreeMFViewer from './3MFFileViewer';

// General 3D Viewer for both STL and OBJ files
const ModelViewer = ({ url, fileType }) => {
  const [geometry, setGeometry] = useState(null);
  const controlsRef = useRef();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loader = fileType === 'stl' ? new STLLoader() : new OBJLoader();
    loader.load(
      url,
      (loadedData) => {
        if (fileType === 'stl') {
          setGeometry(loadedData);
        } else {
          setGroup(loadedData);
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load the geometry:', err);
        setError(err);
      }
    );
  }, [url, fileType]);

  if (error) {
    return <div>Error loading model</div>;
  }
  const zoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.object.zoom *= 1.5; // Zoom in
      controlsRef.current.object.updateProjectionMatrix();
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.object.zoom /= 1.5; // Zoom out
      controlsRef.current.object.updateProjectionMatrix();
    }
  };

  const turnLeft = () => {
    if (controlsRef.current) {
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + 0.8); // Turn left
      controlsRef.current.update();
    }
  };

  const turnRight = () => {
    if (controlsRef.current) {
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() - 0.8); // Turn right
      controlsRef.current.update();
    }
  };

  const turnUp = () => {
    if (controlsRef.current) {
      controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() - 0.8); // Turn up
      controlsRef.current.update();
    }
  };

  const turnDown = () => {
    if (controlsRef.current) {
      controlsRef.current.setPolarAngle(controlsRef.current.getPolarAngle() + 0.8); // Turn down
      controlsRef.current.update();
    }
  };

  return (
    <div className='flex'>
      <div >
        <Canvas className='border border-black' style={{ height: 500,width: 600}}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10,10, 5]} />
          {fileType === 'stl' && geometry && (
            <mesh geometry={geometry} scale={[0.03, 0.03, 0.03]} position={[0,-0, 0]} >
              <meshStandardMaterial color="gray" />
            </mesh>
          )}
          {fileType === 'obj' && group && (
            <primitive object={group} scale={[0.03, 0.03, 0.03]} position={[0, -0, 0]} />
          )}
          <OrbitControls ref={controlsRef} />
        </Canvas>
      </div>
      <div className=" justify-center mt-12">
        <div className='w-8 ml-14 mt-12'>
          <button type="button" onClick={zoomIn} className='   '>
            <img src="/public/zoom_in.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='  w-8 ml-14 mt-2'>
          <button type="button" onClick={zoomOut} className=' '>
            <img src="/public/zoom_out.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3 ml-14'>
          <button type="button" onClick={turnDown} >
            <img src="/public/top.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3 ml-14'>
          <button type="button" onClick={turnUp} >
            <img src="/public/down.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3 ml-14'>
          <button type="button" onClick={turnLeft} >
            <img src="/public/arrow_left.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3 ml-14'>
          <button type="button" onClick={turnRight} >
            <img src="/public/arrow_right.png" alt="Zoom_In" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ url, fileType, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="relative bg-gray-200 p-2 rounded-lg max-w-6xl ">
        <button
          onClick={onClose}
          className='absolute top-0 right-1 w-8 mt-2 ml-10'
        >
          <img src="/public/close_button.png" alt="" />
        </button>
        <ModelViewer url={url} fileType={fileType} />
      </div>
    </div>
  );
};

const StlFileViewer = ({ file }) => {
  const [previewURL, setPreviewURL] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileType, setFileType] = useState(null);
 
  const handleFileChange = () => {

    console.log(file)
     if (file && (file.name.endsWith('.stl') || file.name.endsWith('.obj'))) {
      console.log(file)
      const url = URL.createObjectURL(file);
      const type = file.name.endsWith('.stl') ? 'stl' : 'obj';

      setIsModalOpen(true);
      startTransition(() => {
        setPreviewURL(url);
        setFileType(type);
      });
    } else {
      alert('Please select a valid .stl or .obj file');
    }
  };

  return (
    <div className="col-span-2 p-4">
      <div className="display flex">
        <div className="flex ">
          <button
            type="button"
            onClick={handleFileChange}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-7 py-2 text-center me-2 m-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Preview
          </button>
        </div>
      </div>

       

      {isModalOpen && previewURL && (
        <Modal
          url={previewURL}
          fileType={fileType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default StlFileViewer;
