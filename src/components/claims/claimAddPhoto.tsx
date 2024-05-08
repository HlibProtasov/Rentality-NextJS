import React, { useRef } from "react";
import Image from "next/image";
import { resizeImage } from "@/utils/image";
import { FileToUpload } from "@/model/FileToUpload";

function ClaimAddPhoto({
  filesToUpload,
  setFilesToUpload,
}: {
  filesToUpload: FileToUpload[];
  setFilesToUpload: (newValue: FileToUpload[]) => void;
}) {
  const MAX_ADD_IMAGE = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    inputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      return;
    }

    let file = e.target.files[0];

    // image/jpeg, image/png
    if (file.type.startsWith("image/")) {
      file = await resizeImage(file, 1000);
    } else if (file.size > 5 * 1024 * 1024) {
      alert("File is too big");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileUrl = event.target?.result as string;
      setFilesToUpload([...filesToUpload, { file: file, localUrl: fileUrl }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="my-2">
      <p className="mt-2 mb-1">Up to 5 photos possible</p>
      <div className="flex flex-row gap-4">
        {filesToUpload.map((fileToUpload, index) => {
          return (
            <div key={index} className="w-48 h-40 rounded-2xl overflow-hidden">
              {fileToUpload.file.type.startsWith("image/") ? (
                <Image
                  className="w-full h-full object-cover"
                  width={1000}
                  height={1000}
                  src={fileToUpload.localUrl}
                  alt=""
                />
              ) : (
                <div className="w-full h-full relative bg-gray-200 bg-opacity-60 bg-center bg-no-repeat">
                  <span className="absolute w-full bottom-4 text-center">{fileToUpload.file.name}</span>
                </div>
              )}
            </div>
          );
        })}
        {filesToUpload.length < MAX_ADD_IMAGE ? (
          <div className="w-48 h-40 rounded-2xl overflow-hidden cursor-pointer bg-gray-200 bg-opacity-40 bg-center bg-no-repeat bg-[url('../images/add_circle_outline_white_48dp.svg')]">
            <div className="w-full h-full" onClick={handleImageClick} />
            <input className="hidden" type="file" accept="image/*" ref={inputRef} onChange={handleImageChange} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ClaimAddPhoto;
