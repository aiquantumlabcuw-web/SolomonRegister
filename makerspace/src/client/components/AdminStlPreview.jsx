import React, { useState, useRef, startTransition } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from '@react-three/drei';
import ThreeMFViewer from './3MFFileViewer';

const ModelViewer = ({ url, fileType }) => {
  const geometry = fileType === 'stl' ? useLoader(STLLoader, url) : null;
  const object = fileType === 'obj' ? useLoader(OBJLoader, url) : null;
  const controlsRef = useRef();

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
      <div>
        <Canvas className='border border-black' style={{ height: 500, width: 600 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />
          {fileType === 'stl' && geometry && (
            <mesh geometry={geometry} scale={[0.03, 0.03, 0.03]} position={[0,-0, 0]}>
              <meshStandardMaterial color="gray" />
            </mesh>
          )}
          {fileType === 'obj' && object && (
            <primitive object={object} scale={[0.03, 0.03, 0.03]} position={[0,-0, 0]} />
          )}
          <OrbitControls ref={controlsRef} />
        </Canvas>
      </div>
      <div className=" justify-center ml-6 mt-12">
        <div className='w-8  mt-12'>
          <button onClick={zoomIn} className='   '>
            <img src="/public/zoom_in.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='  w-8   mt-2'>
          <button onClick={zoomOut} className=' '>
            <img src="/public/zoom_out.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3  '>
          <button onClick={turnDown} >
            <img src="/public/top.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3  '>
          <button onClick={turnUp} >
            <img src="/public/down.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3  '>
          <button onClick={turnLeft} >
            <img src="/public/arrow_left.png" alt="Zoom_In" />
          </button>
        </div>
        <div className='w-8 mt-3  '>
          <button onClick={turnRight} >
            <img src="/public/arrow_right.png" alt="Zoom_In" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ url, onClose, fileType }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="relative bg-gray-200 p-4 rounded-lg max-w-6xl">
        <button
          onClick={onClose}
          className='absolute top-2 right-2 w-8 mt-2 ml-14'
        >
          <img src="/public/close_button.png" alt="Close_Button" />
        </button>
        <ModelViewer url={url} fileType={fileType} />
      </div>
    </div>
  );
};

// Admin File Preview Component
const AdminFilePreview = ({ file }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const handleClick = () => {
    const fileExtension = file ? file.split('.').pop().toLowerCase() : null;
     if(fileExtension === '3mf'){
      <ThreeMFViewer  fileUrl={file}/>
      }else if(fileExtension === 'stl' || fileExtension === 'obj') {
      setFileType(fileExtension);

      // Check if the file is a File object or a URL
      if (typeof file === 'string') {
        setFileUrl(file); // Use the string URL directly
      } else {
        setFileUrl(URL.createObjectURL(file)); // Use createObjectURL for file object
      }

      setIsModalOpen(true);
      startTransition(() => {
        setShowPreview(true);
      });
    } else {
      alert("Invalid file type. Please select a .stl or .obj file.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-7 py-2 text-center me-2 m-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Preview
      </button>

      {isModalOpen && showPreview && (
        <Modal
          url={fileUrl} // Pass the generated file URL or direct URL
          fileType={fileType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default AdminFilePreview;
