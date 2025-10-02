import React, { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader";
import * as THREE from "three";

function Model({ file }) {
  const loader = new ThreeMFLoader();
  const group = useRef();
  const { scene } = useThree();

  useEffect(() => {
      const fileUrl = URL.createObjectURL(file); // Create a file URL for the .3mf file

      // Load the 3MF model from the file URL
      loader.load(
          fileUrl,
          (object) => {
              console.log('Model loaded successfully:', object);
              object.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                      child.material = new THREE.MeshStandardMaterial({
                        
                        
                        
                        roughness: 0.9, // Adjust roughness for a realistic look
                        metalness:0.5  }); // Default gray
                  }
              });

              // Center and scale the object
              object.scale.set(0.1, 0.1, 0.1); // Adjust scaling as needed
              const box = new THREE.Box3().setFromObject(object);
              const center = box.getCenter(new THREE.Vector3());
              object.position.sub(center);

              // Add the object to the scene
              scene.add(object);
              group.current = object; // Assign loaded object to group ref
          },
          (xhr) => {
              const percentage = (xhr.loaded / xhr.total) * 100;
              console.log(`Model loaded: ${percentage.toFixed(2)}%`);
          },
          (error) => {
              console.error('An error occurred while loading the model:', error);
          }
      );

      // Clean up: remove the model and revoke the object URL
      return () => {
          if (group.current) {
              scene.remove(group.current);
          }
          URL.revokeObjectURL(fileUrl);
      };
  }, [file, loader, scene]);

  return <group ref={group} />;
}
const ThreeMFViewer = ({ file }) => {
    const [isModalOpen, setIsModalOpen] = useState(false); // Set default to false (modal closed)
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
  
    // Add Preview button to trigger modal open
    const handlePreviewClick = () => {
      if (file) {
        setIsModalOpen(true);
      } else {
        alert('Please select a valid .3mf file');
      }
    };
  
    return (
      <div>
        {/* Add Preview Button */}
        <button
          type="button"
          onClick={handlePreviewClick}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-7 py-2 text-center me-2 m-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Preview
        </button>
  
        {/* Show the modal when isModalOpen is true */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="flex relative bg-gray-200 p-2 rounded-lg max-w-6xl ">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="absolute top-0 right-1 w-8 mt-2 ml-10"
              >
                <img src="/public/close_button.png" alt="Close" />
              </button>
              <div>
                <Canvas className="border border-black" style={{ height: 500, width: 600 }} camera={{ position: [0, 0, 10], fov: 75}}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10,10, 5]} angle={0.15} penumbra={1} />
                  <OrbitControls ref={controlsRef} target={[0, 0, 0]}/>
                  <Model file={file} />
                </Canvas>
              </div>
              <div className="justify-center mt-12">
                <div className="w-8 ml-14 mt-12">
                  <button onClick={zoomIn} className="">
                    <img src="/public/zoom_in.png" alt="Zoom In" />
                  </button>
                </div>
                <div className="w-8 ml-14 mt-2">
                  <button onClick={zoomOut} className="">
                    <img src="/public/zoom_out.png" alt="Zoom Out" />
                  </button>
                </div>
                <div className="w-8 mt-3 ml-14">
                  <button onClick={turnDown}>
                    <img src="/public/top.png" alt="Turn Down" />
                  </button>
                </div>
                <div className="w-8 mt-3 ml-14">
                  <button onClick={turnUp}>
                    <img src="/public/down.png" alt="Turn Up" />
                  </button>
                </div>
                <div className="w-8 mt-3 ml-14">
                  <button onClick={turnLeft}>
                    <img src="/public/arrow_left.png" alt="Turn Left" />
                  </button>
                </div>
                <div className="w-8 mt-3 ml-14">
                  <button onClick={turnRight}>
                    <img src="/public/arrow_right.png" alt="Turn Right" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  

 


export default ThreeMFViewer;