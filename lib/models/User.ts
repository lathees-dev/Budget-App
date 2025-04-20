import { ObjectId } from "mongodb";

export interface UserModel {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
}
