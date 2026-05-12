import {Deity} from '@/types';

// Gradients chosen to evoke each deity's traditional iconography.
// All `iconName` values map to react-native-vector-icons (FontAwesome5 + MaterialCommunityIcons).
export const DEITIES: readonly Deity[] = [
  {
    id: 'shiva',
    name: 'Lord Shiva',
    sanskritName: 'शिव',
    description:
      'The Destroyer and Transformer. Lord of meditation, dance, and the cosmos.',
    iconName: 'om',
    gradient: ['#4B0000', '#8B0000'],
  },
  {
    id: 'vishnu',
    name: 'Lord Vishnu',
    sanskritName: 'विष्णु',
    description:
      'The Preserver. Sustainer of the universe, taker of ten avatars.',
    iconName: 'feather',
    gradient: ['#1e3a8a', '#2563eb'],
  },
  {
    id: 'devi',
    name: 'Goddess Devi',
    sanskritName: 'देवी',
    description:
      'The Divine Mother. Source of all creation in her many forms.',
    iconName: 'flower',
    gradient: ['#831843', '#be185d'],
  },
  {
    id: 'hanuman',
    name: 'Lord Hanuman',
    sanskritName: 'हनुमान',
    description:
      'The Devotee. Embodiment of strength, courage, and devotion to Rama.',
    iconName: 'fire',
    gradient: ['#b45309', '#f59e0b'],
  },
  {
    id: 'krishna',
    name: 'Lord Krishna',
    sanskritName: 'कृष्ण',
    description:
      'The Divine Charioteer. Speaker of the Bhagavad Gita and embodiment of love.',
    iconName: 'music',
    gradient: ['#1e40af', '#3b82f6'],
  },
  {
    id: 'rama',
    name: 'Lord Rama',
    sanskritName: 'राम',
    description:
      'The Ideal King. Hero of the Ramayana, embodiment of dharma.',
    iconName: 'crown',
    gradient: ['#065f46', '#10b981'],
  },
  {
    id: 'ganesha',
    name: 'Lord Ganesha',
    sanskritName: 'गणेश',
    description:
      'The Remover of Obstacles. Lord of beginnings and patron of arts and sciences.',
    iconName: 'star',
    gradient: ['#9a3412', '#f97316'],
  },
  {
    id: 'lakshmi',
    name: 'Goddess Lakshmi',
    sanskritName: 'लक्ष्मी',
    description:
      'Goddess of wealth, fortune, prosperity, and beauty.',
    iconName: 'gem',
    gradient: ['#a16207', '#eab308'],
  },
  {
    id: 'saraswati',
    name: 'Goddess Saraswati',
    sanskritName: 'सरस्वती',
    description:
      'Goddess of knowledge, music, art, wisdom, and learning.',
    iconName: 'book-open',
    gradient: ['#0c4a6e', '#0ea5e9'],
  },
  {
    id: 'kartikeya',
    name: 'Lord Kartikeya',
    sanskritName: 'कार्तिकेय',
    description:
      'The Commander of Devas. God of war and victory, son of Shiva and Parvati.',
    iconName: 'shield-alt',
    gradient: ['#7c2d12', '#dc2626'],
  },
];

export function findDeity(id: string): Deity | undefined {
  return DEITIES.find(d => d.id === id);
}
