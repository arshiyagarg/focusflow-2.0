export interface User {
  id: string;                      
  email: string;
  name: string;
  passwordHash: string;

  authProvider: "local" | "google" | "github"; //we can include or exclude all this later

  previousContentList: string[];   // storing content IDs or outputs

  createdAt: string;               //ISO timestamp
  lastLogin: string;               // ISO timestamp
  type: "USER";
}
