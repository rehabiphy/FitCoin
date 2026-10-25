/** Marketplace catalog. `stock: null` means unlimited. */
export const MARKET_CATEGORIES = ['Vouchers', 'Fitness', 'Food', 'Lifestyle', 'Charity'];

export const MARKET_REWARDS = [
  { slug: 'amazon-250', brand: 'Amazon', title: '₹250 Gift Card', category: 'Vouchers', cost: 500, icon: 'ShoppingBag', gradient: ['#FF8A3D', '#FFC94D'], stock: null, tag: 'Popular', sort: 1 },
  { slug: 'cultfit-month', brand: 'Cult.fit', title: '1 Month Gym Pass', category: 'Fitness', cost: 1800, icon: 'Dumbbell', gradient: ['#FF5C9A', '#7C5CFF'], stock: 24, tag: 'Hot', sort: 2 },
  { slug: 'starbucks-tall', brand: 'Starbucks', title: 'Free Tall Coffee', category: 'Food', cost: 220, icon: 'Coffee', gradient: ['#34F5B4', '#22D3EE'], stock: null, sort: 3 },
  { slug: 'decathlon-15', brand: 'Decathlon', title: '15% Off Sportswear', category: 'Lifestyle', cost: 350, icon: 'Shirt', gradient: ['#4D8DFF', '#22D3EE'], stock: null, sort: 4 },
  { slug: 'spotify-month', brand: 'Spotify', title: '1 Month Premium', category: 'Lifestyle', cost: 650, icon: 'Headphones', gradient: ['#34F5B4', '#4D8DFF'], stock: null, tag: 'New', sort: 5 },
  { slug: 'swiggy-100', brand: 'Swiggy', title: '₹100 Off Healthy Meals', category: 'Food', cost: 200, icon: 'Leaf', gradient: ['#FF8A3D', '#FF5C9A'], stock: 120, sort: 6 },
  { slug: 'giveindia-trees', brand: 'GiveIndia', title: 'Plant 5 Trees', category: 'Charity', cost: 300, icon: 'Heart', gradient: ['#34F5B4', '#7C5CFF'], stock: null, sort: 7 },
  { slug: 'bms-ticket', brand: 'BookMyShow', title: 'Movie Ticket', category: 'Vouchers', cost: 900, icon: 'Ticket', gradient: ['#7C5CFF', '#FF5C9A'], stock: 58, sort: 8 },
];
