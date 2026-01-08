// Since we don't have a real DB connection set up in this boilerplate, 
// these classes will act as our shape definitions and in-memory storage types.
// In a real app, you would decorate these with TypeORM or Mongoose decorators.

export class Room {
  id: string;
  name: string;
  description?: string;
}
