import { Record } from 'src/interfaces';

export interface CreateReceivingDto {
  client: string;
  records: Record[];
  timestamp: number;
}

export interface UpdateReceivingDto {
  id: string;
  newData: CreateReceivingDto;
}