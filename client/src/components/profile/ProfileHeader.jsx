import React, { useState, useRef } from 'react';
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from '../common/Modal';
import { getCroppedImg } from '../../utils/cropImage';

const ProfileHeader = ({ user, onUpdate }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [isHoveringPicture, setIsHoveringPicture] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleNameSave = () => {
    onUpdate({ name });
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setName(user.name);
    setIsEditingName(false);
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsModalOpen(true);
      e.target.value = null;
    }
  };

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: 'px', width: 150 }, 1, width, height), width, height));
  };

  const handleCropSave = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      onUpdate({ picture: URL.createObjectURL(croppedImageBlob) });
      setIsModalOpen(false);
      setImgSrc('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-6">
        {/* Profile Picture with Hover Edit */}
        <div 
          className="relative cursor-pointer"
          onMouseEnter={() => setIsHoveringPicture(true)}
          onMouseLeave={() => setIsHoveringPicture(false)}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-400 shadow-lg">
            <img 
              src={user.picture} 
              alt={user.name} 
              className={`w-full h-full object-cover transition-all duration-300 ${
                isHoveringPicture ? 'brightness-75' : ''
              }`}
            />
          </div>
          
          {/* Online Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-3 border-[#1e1332]"></div>
          
          {/* Edit Picture Button - Only visible on hover */}
          {isHoveringPicture && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-opacity-70"
              aria-label="Edit profile picture"
            >
              <FaEdit className="text-white text-xl" />
            </button>
          )}
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onSelectFile} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Name Section with Edit Functionality */}
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="text-3xl font-bold bg-transparent border-b-2 border-purple-400 focus:outline-none text-white min-w-0 px-2 py-1 focus:border-purple-300 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
              />
              <button 
                onClick={handleNameSave}
                className="text-green-400 hover:text-green-300 text-xl p-2 hover:bg-green-400/10 rounded-lg transition-colors"
                aria-label="Save name"
              >
                <FaCheck />
              </button>
              <button 
                onClick={handleNameCancel}
                className="text-red-400 hover:text-red-300 text-xl p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                aria-label="Cancel editing"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <h1 className="text-3xl font-bold tracking-wide text-white">
                {user.name.toUpperCase()}
              </h1>
              <button 
                onClick={() => setIsEditingName(true)}
                className="text-gray-400 hover:text-white text-xl p-2 hover:bg-white/10 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100"
                aria-label="Edit name"
              >
                <FaEdit />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Cropping Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-white rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Crop your new photo
          </h3>
          {imgSrc && (
            <div className="mb-6 flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-w-full"
              >
                <img 
                  ref={imgRef} 
                  alt="Crop preview" 
                  src={imgSrc} 
                  onLoad={onImageLoad}
                  className="max-w-full max-h-96 rounded-lg"
                />
              </ReactCrop>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleCropSave} 
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Save Photo
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProfileHeader;