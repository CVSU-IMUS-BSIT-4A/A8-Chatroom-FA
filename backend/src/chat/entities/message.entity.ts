// In-memory message model (not persisted in DB)
export class Message {
  id: string;
  roomId: string;
  sender: string;
  content: string;
  createdAt: Date;
}
