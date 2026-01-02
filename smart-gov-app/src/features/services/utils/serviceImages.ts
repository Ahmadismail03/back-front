import type { ImageSourcePropType } from 'react-native';
import type { Service } from '../../../core/domain/service';

/**
 * Get appropriate image for each service based on service ID and category
 * Uses high-quality images from Unsplash and other sources
 */
export function getServiceImageSource(service: Pick<Service, 'id' | 'category' | 'imageKey'>): { uri: string } | ImageSourcePropType {
  // Service-specific images
  switch (service.id) {
    case 'svc_renew_id':
      // National ID renewal - ID card image
      return { uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop' };
    
    case 'svc_passport_renew':
      // Passport renewal - Palestinian passport image
      return { uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop' };
    
    case 'svc_birth_cert':
      // Birth certificate - document image
      return { uri: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop' };
    
    case 'svc_vehicle_reg':
      // Vehicle registration - car image
      return { uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop' };
    
    case 'svc_driver_license_renew':
      // Driver license - license/driving image
      return { uri: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop' };
    
    case 'svc_parking_permit':
      // Parking permit - parking/city image
      return { uri: 'https://images.unsplash.com/photo-1449824913935-9a10bd0e0871?w=400&h=300&fit=crop' };
    
    default:
      // Fallback to category-based images
      switch (service.category) {
        case 'IDENTITY':
          return { uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop' };
        case 'TRANSPORT':
          return { uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop' };
        case 'PERMITS':
          return { uri: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop' };
        default:
          return { uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop' };
      }
  }
}
