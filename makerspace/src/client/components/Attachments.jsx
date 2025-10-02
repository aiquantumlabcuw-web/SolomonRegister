import { useEffect, useRef, useState } from "react";
import StlFileViewer from "./STLFileViewer";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { fileType } from "../store/atoms/isLoggedIn";
import ThreeMFViewer from "./3MFFileViewer";

const Attachments = ({ files, setFiles, ticketType }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const warningStl = useRecoilValue(fileType);
  const setWarningStl = useSetRecoilState(fileType);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
        file: file,
        status: "Uploaded",
      }));

      setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    }
  };

  const handleFileSelection = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file: file,
      status: "Uploaded",
    }));
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes >= 1024 * 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (sizeInBytes >= 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file, index) => index !== indexToRemove)
    );
  };

  useEffect(() => {
    const hasStlFile = files.some(file => /\.(stl|obj|3mf)$/i.test(file.file.name));
    // true if there is at least one .stl file
    if (hasStlFile) {
      setWarningStl("")
    } else {
      setWarningStl("There should be atleast one .stl/.obj file")
    }
  }, [files, setWarningStl]);
  // console.log(files)
  return (
    <>
      <div >
        <div
          className={`border-2 ${dragActive ? "border-blue-500 bg-gray-400" : "border-dashed border-gray-300"} rounded-lg p-6 text-center`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="m-auto mt-6 w-8">
            <img src="upload.svg" alt="Upload Icon" />
          </div>
          <div className="w-full text-center">
            <label className="font-bold">Drag & Drop your model here</label>
          </div>
          <div className="w-full text-center">
            <label>Allowed File Types: .stl, .obj, .pdf, .jpeg</label>
          </div>
          <div >
            {ticketType === "3d Printing Request" ? (
              <p className="text-red-400">{warningStl}</p>
            ) : (
              <p className="text-green-400">Attach files of types: .stl, .obj, .pdf, .jpeg file</p>
            )}
          </div>
          <div>
            <div className="flex justify-center items-center">
              <input
                ref={fileInputRef}
                className="hidden"
                multiple
                type="file"
                onChange={handleFileSelection}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center mt-4 bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600"
              >
                <p className="pr-2 text-xl">+</p> Browse File
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        {files.map((file, index) => (
          <div key={index} className="flex items-center p-2 border rounded-2xl border-gray-200 mb-4">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16m10-16v16m-5-4h-3v-4m0-4v4m8 0v-4m0 0H7m3-4H5v8h4m0 0h3v4m0-4h4v8H7"
                />
              </svg>
            </div>
            <div className="ml-3 flex-grow">
              <p className="text-sm font-medium text-gray-800">{file.file.name}</p>
              <p className="text-xs text-gray-500">
                {`${formatFileSize(file.file.size)}`}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${file.status === "Uploaded" ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
            <div className="ml-3 flex items-center justify-center">
              <span className="cursor-pointer text-red-500" onClick={() => removeFile(index)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </span>
            </div>

            <div>
              {file.file?.name?.match(/\.(3mf)$/i) ? <ThreeMFViewer file={file.file} /> : ""}
            </div>
            <div>
              {file.file?.name?.match(/\.(stl|obj)$/i) ? <StlFileViewer file={file.file} /> : ""}
            </div>


          </div>
        ))}
      </div>
    </>
  );
};

export default Attachments;
