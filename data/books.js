// In-memory database for the MVP
let books = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    pricePerDay: 1.5,
    ownerId: 'initial_owner_1',
    isAvailable: true,
    renterId: null,
    rentedUntil: null,
    postedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    pricePerDay: 1.25,
    ownerId: 'initial_owner_2',
    isAvailable: false,
    renterId: 'initial_renter_1',
    rentedUntil: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    postedAt: new Date().toISOString(),
  },
];

export default books;
