export interface CreateOwnReceivingDto {
  weight: number;
  timestamp: number;
}

export interface UpdateOwnReceivingDto {
  id: string;
  newData: CreateOwnReceivingDto;
}