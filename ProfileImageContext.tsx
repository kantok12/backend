import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProfileImage {
  rut: string;
  imageUrl: string;
  fileName: string;
  uploadedAt: Date;
}

interface ProfileImageContextType {
  profileImages: Map<string, ProfileImage>;
  uploadProfileImage: (rut: string, file: File) => Promise<string>;
  getProfileImage: (rut: string) => string | null;
  deleteProfileImage: (rut: string) => void;
  hasProfileImage: (rut: string) => boolean;
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(undefined);

interface ProfileImageProviderProps {
  children: ReactNode;
}

export const ProfileImageProvider: React.FC<ProfileImageProviderProps> = ({ children }) => {
  const [profileImages, setProfileImages] = useState<Map<string, ProfileImage>>(new Map());

  // Función para convertir File a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Subir imagen de perfil
  const uploadProfileImage = useCallback(async (rut: string, file: File): Promise<string> => {
    try {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Solo se permiten imágenes: JPG, PNG, GIF, WEBP');
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB.');
      }

      // Convertir a base64
      const base64Url = await fileToBase64(file);
      
      // Crear objeto de imagen de perfil
      const profileImage: ProfileImage = {
        rut,
        imageUrl: base64Url,
        fileName: file.name,
        uploadedAt: new Date()
      };

      // Actualizar el estado
      setProfileImages(prev => {
        const newMap = new Map(prev);
        newMap.set(rut, profileImage);
        return newMap;
      });

      // Guardar en localStorage para persistencia
      const storedImages = JSON.parse(localStorage.getItem('profileImages') || '{}');
      storedImages[rut] = {
        ...profileImage,
        uploadedAt: profileImage.uploadedAt.toISOString()
      };
      localStorage.setItem('profileImages', JSON.stringify(storedImages));

      return base64Url;
    } catch (error) {
      console.error('Error al subir imagen de perfil:', error);
      throw error;
    }
  }, []);

  // Obtener imagen de perfil
  const getProfileImage = useCallback((rut: string): string | null => {
    const profileImage = profileImages.get(rut);
    return profileImage ? profileImage.imageUrl : null;
  }, [profileImages]);

  // Verificar si tiene imagen de perfil
  const hasProfileImage = useCallback((rut: string): boolean => {
    return profileImages.has(rut);
  }, [profileImages]);

  // Eliminar imagen de perfil
  const deleteProfileImage = useCallback((rut: string) => {
    setProfileImages(prev => {
      const newMap = new Map(prev);
      newMap.delete(rut);
      return newMap;
    });

    // Eliminar de localStorage
    const storedImages = JSON.parse(localStorage.getItem('profileImages') || '{}');
    delete storedImages[rut];
    localStorage.setItem('profileImages', JSON.stringify(storedImages));
  }, []);

  // Cargar imágenes desde localStorage al inicializar
  React.useEffect(() => {
    const storedImages = localStorage.getItem('profileImages');
    if (storedImages) {
      try {
        const parsedImages = JSON.parse(storedImages);
        const imageMap = new Map<string, ProfileImage>();
        
        Object.entries(parsedImages).forEach(([rut, imageData]: [string, any]) => {
          imageMap.set(rut, {
            rut,
            imageUrl: imageData.imageUrl,
            fileName: imageData.fileName,
            uploadedAt: new Date(imageData.uploadedAt)
          });
        });
        
        setProfileImages(imageMap);
      } catch (error) {
        console.error('Error al cargar imágenes desde localStorage:', error);
      }
    }
  }, []);

  const value: ProfileImageContextType = {
    profileImages,
    uploadProfileImage,
    getProfileImage,
    deleteProfileImage,
    hasProfileImage
  };

  return (
    <ProfileImageContext.Provider value={value}>
      {children}
    </ProfileImageContext.Provider>
  );
};

// Hook para usar el contexto
export const useProfileImageContext = (): ProfileImageContextType => {
  const context = useContext(ProfileImageContext);
  if (context === undefined) {
    throw new Error('useProfileImageContext debe ser usado dentro de un ProfileImageProvider');
  }
  return context;
};

// Hook específico para una imagen de perfil
export const useProfileImage = (rut: string) => {
  const { getProfileImage, hasProfileImage, uploadProfileImage, deleteProfileImage } = useProfileImageContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileImage = getProfileImage(rut);
  const hasImage = hasProfileImage(rut);

  const uploadImage = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const imageUrl = await uploadProfileImage(rut, file);
      return imageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir imagen';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = () => {
    setError(null);
    deleteProfileImage(rut);
  };

  return {
    profileImage,
    hasImage,
    loading,
    error,
    uploadImage,
    deleteImage
  };
};
